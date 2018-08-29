const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const	http = require("http").Server(app);
const io = require("socket.io")(http);
const webpack = require("webpack");
const config = require("./webpack.config.js");
const compiler = webpack(config);
const bcrypt = require("bcrypt");

require('dotenv').config()

const MongoClient = require("mongodb").MongoClient;
const assert = require('assert');
const dbURL = `mongodb://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@ds125862.mlab.com:25862/lolchat`;
const db = MongoClient.connect(dbURL);

app.use(require("webpack-dev-middleware")(
	compiler,
	config.devServer
));
app.use(require("webpack-hot-middleware")(compiler));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "dist")));

// Routes //
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

app.post("/action/login", function(req, res) {
	var nickname = req.body.nickname;
	var password = req.body.password;

	db.then(function(client) {
		let db = client.db("lolchat");

		// Check if nickname has been used
		var existingUser = db.collection("users").findOne({
			nickname
		});

		existingUser.then(function(doc) {
			if (doc) {
				// Check password
				try {
					var hash = bcrypt.hash(req.body.password, doc.password, function(err, result) {
						if (err) {
							throw err;
						}

						if (result) {
							res.send({
								action: "LOGIN_SUCCESS"
							});
						} else {
							res.send({
								action: "WRONG_PASSWORD"
							});
						}
					});
				}

				catch (e) {
					res.send({
						error: e,
						action: "LOGIN_FAILURE_UNKNOWN_ERROR"
					});
				}
			} else {
				res.send({
					action: "ACCOUNT_NONEXISTENT"
				});
			}
		});
	});
});

app.post("/action/signup", function(req, res) {
	var nickname = req.body.nickname;
	var password = req.body.password;

 	db.then(function(client) {
 		let db = client.db("lolchat");

		// Check if nickname has been used
		var existingUser = db.collection("users").findOne({
			nickname
		});

		existingUser.then(function(doc) {
			if (!doc) {
				// Register user
				try {
					var hash = bcrypt.hash(password, 10, function(err, hash) {
						if (err) {
							throw err;
						}
					  	
						// Register user
					  	db.collection("users").insertOne({
					  		nickname,
					  		password: hash,
					  		thumbsUp: 0,
					  		thumbsDown: 0
					  	}, function(err, result) {
					  		if (err) {
								throw err;
							}

							res.send({
								action: "REGISTRATION_SUCCESS"
							});
					  	});
					});
				}

				catch (e) {
					res.send({
						error: e,
						action: "REGISTRAION_FAILURE_UNKNOWN_ERROR"
					});
				}
			} else {
				res.send({
					action: "NICKNAME_IN_USE"
				});
			}
		});
	});
});


// Chat //

// Time people wait before socket is closed
var TIMEOUT = 10000;
// Difference between user ratings above which two people cannot connect
var DIFFERENCE = .3;

// unmatchedClients: These are people waiting to be matched. They will be removed from this object TIMEOUT milliseconds after being added.
var unmatchedClients = [];

/*
matchedClients: These are people who have been matched.
	They will be removed from this array on disconnect.
	Schema: {
		nickname: String,
		rating: Int,
		partner: String,
		socketId: String
	}
*/
var matchedClients = [];

// Flag, true if matching function is running
var matching = false;

io.on("connection", function(socket) {
	socket.on("client: new client", function(obj, cb) {
		cb("matching you with a stranger ...");
		addUnmatchedClient(obj.nickname, socket.id);

		console.log("CLIENTS : ", unmatchedClients);

		if(!matching && unmatchedClients.length > 1) {
			match();
		}
	});

	socket.on("client: new message", function(data, cb) {
		sendMessage(data, socket, cb);
	});
});

function addUnmatchedClient(nickname, socketId) {
	let clientIsInArray = !!unmatchedClients.find( obj => obj.nickname === nickname );

	if (!clientIsInArray) unmatchedClients.push({nickname, socketId});

	setTimeout((nickname) => {
		let clientIsInArray = !!unmatchedClients.find( obj => obj[nickname] === nickname );
		if (clientIsInArray) {
			let i = getObjectIndexByPropVal("nickname", nickname, unmatchedClients);
			unmatchedClients.splice(i, 1);
		}
	}, TIMEOUT);
}

function getDifferentItemFromArray(arr, value) {
	if (arr.length < 2) return null;
	var item = arr[Math.floor(Math.random() * arr.length)];
	if (item !== value) return item;
	return getDifferentItemFromArray(arr, value);
}

function getObjectIndexByPropVal(propStr, val, arr) {
	return arr.map(function(x) {return x[propStr]; }).indexOf(val);
}

function match() {
	matching = true;
	var user1 = getDifferentItemFromArray(unmatchedClients, null);
	var user2 = getDifferentItemFromArray(unmatchedClients, user1);

	if ( !(user1 && user2) ) {
		matching = false;
		return;
	}

	let counter = 0;

	db.then(function(client) {
		let db = client.db("lolchat");

		var users = db.collection("users").find({
			$or: [{"nickname": user1.nickname}, {"nickname": user2.nickname}]
		}).toArray(function(err, result) {
			assert.equal(err, null);
			assert.equal(2, result.length);

			let a = [user1, user2];

			// Calculate rating, add it to correct object
			for (let i = 0; i < result.length; i++) {
				result[i].rating = (result[i].thumbsUp + result[i].thumbsDown) / 2;

				for (let j = 0; j < a.length; j++) {
					if (a[j].nickname === result[i].nickname) {
				      a[j].rating = result[i].rating;
				    }
				}
			}

			// Make sure connections are still open
			io.clients((err, clientIds) => {
				if (err) {
					console.log(err);
				}

				var areConnectionsOpen;
				
				for(let i = 0; i < a.length; i++) {
			        if (clientIds.includes(a[i].socketId)) {
			        	areConnectionsOpen = true;
			        } else {
			        	areConnectionsOpen = false;
			        	break;
			        };
			    }

			    // If connections open and ratings are close, match
			    if (Math.abs(a[0].rating - a[1].rating) < DIFFERENCE && areConnectionsOpen) {
					a[0].partner = a[1].socketId;
					a[1].partner = a[0].socketId;

					// Remove the matched users from `unmatchedClients`
					for (let i = 0; i < a.length; i++) {
						let index = getObjectIndexByPropVal("nickname", a[i].nickname, unmatchedClients);
						if (index > -1) unmatchedClients.splice(index, 1);
					}

					// Add them to `matchedClients`
					matchedClients.push(a[0], a[1]);
					console.log("NEW MATCH. \nMATCHES: ", matchedClients);
				}

				// Then decide whether to recurse
				if (unmatchedClients.length < 2) {
					matching = false;
				} else {
					match();
				}
			});
		});
	});
}

function sendMessage(data, socket, cb) {
	//console.log(socket.id, matchedClients);

	let message = data.message;
	let sender = matchedClients.find(elt => {
		return elt.socketId === socket.id;
	});

	console.log("CLIENZ: ", matchedClients, "sender :" , sender);

	let to = sender.partner;

	socket.broadcast.to(to).emit('server: new message', { message });

	cb("success sending your message ...");
}



http.listen(3000);
// app.listen(3000, function() {
// 	console.log('listening on port 3000.');
// });