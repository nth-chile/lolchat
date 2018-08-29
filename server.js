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
// Flag, true if matching function is running
var matching = false;

io.on("connection", function(socket) {
	socket.on("client: new client", function(obj, fn) {
		fn("matching you with a stranger ...");
		addUnmatchedClient(obj.nickname, socketId);

		if(!matching && unmatchedClients.length > 1) {
			match();
		}
	});
});

function addUnmatchedClient(nickname, socketId) {
	let clientIsInArray = !!unmatchedClients.find( obj => obj.nickname === nickname );

	if (!clientIsInArray) unmatchedClients.push({nickname, socketId});

	setTimeout(() => {
		let clientIsInArray = !!unmatchedClients.find( obj => obj[nickname] === nickname );
		if (clientIsInArray) {
			let i = getObjectIndexByPropVal("nickname", nickname, unmatchedClients);
			unmatchedClients.splice(i, 1);
		}
	}, TIMEOUT);
}

function getDifferentItemFromArray(arr, value) {
	var item = arr[Math.floor(Math.random() * arr.length)];
	if (item !== value) return item;
	return getDifferentItemFromArray(arr, value);
}

function getObjectIndexByPropVal(prop, val, arr) {
	return arr.map(function(x) {return x[prop]; }).indexOf(val);
}

function match() {
	matching = true;
	var user1 = getDifferentItemFromArray(unmatchedClients, null);
	var user2 = getDifferentItemFromArray(unmatchedClients, user1);

	var user1Rating, user2Rating;

	db.then(function(client) {
		let db = client.db("lolchat");

		var users = db.collection("users").find({
			$or: [{"nickname": user1}, {"nickname": user2}]
		}, function(err, cursor) {
			cursor.toArray(function(err, result) {
				for (let i = 0; i < result.length; i++) {
					result[i].rating = (result[i].thumbsUp + result[i].thumbsDown) / 2;
				}

				user1 = {
					nickname: result[0]["nickname"],
					rating: result[0]["rating"]
				};

				user2 = {
					nickname: result[1]["nickname"],
					rating: result[1]["rating"]
				};

				if (Math.abs(user1.rating - user2.rating) < DIFFERENCE && "connection is open") {
					//ok ... matchm.

					let i = unmatchedClients.indexOf(user1.nickname);
					if (i > -1) unmatchedClients.splice(i, 1);
					i = unmatchedClients.indexOf(user2.nickname);
					if (i > -1) unmatchedClients.splice(i, 1);
				}

				if (unmatchedClients < 2) {
					matching = false;
				} else {
					match();
				}
			});
		});
	});
}



http.listen(3000);
// app.listen(3000, function() {
// 	console.log('listening on port 3000.');
// });