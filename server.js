const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const	http = require("http").Server(app);
const io = require("socket.io")(http);
const webpack = require("webpack");
const bcrypt = require("bcrypt");
const MongoClient = require("mongodb").MongoClient;
const assert = require('assert');

require('dotenv').config()

const IS_DEV = process.env.NODE_ENV === "development";

const dbURL = `mongodb://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@ds125862.mlab.com:25862/lolchat`;
const db = MongoClient.connect(dbURL);

if (IS_DEV) {
	const config = require("./webpack.development.js");
	const compiler = webpack(config);

	app.use(require("webpack-dev-middleware")(
		compiler,
		config.devServer
	));
	app.use(require("webpack-hot-middleware")(compiler));
}

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
							let rating = getRating(doc.thumbsUp, doc.thumbsDown);

							res.send({
								action: "LOGIN_SUCCESS",
								rating
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

							let rating = getRating(0, 0);

							res.send({
								action: "REGISTRATION_SUCCESS",
								rating
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
var DIFFERENCE = .5;

// unmatchedClients: These are people waiting to be matched. They will be removed from this object TIMEOUT milliseconds after being added.
var unmatchedClients = [];

/*
matchedClients: These are people who have been matched.
	They will be removed from this array on disconnect.
	Schema: {
		nickname: String,
		rating: Int,
		partnerId: String,
		socketId: String
	}
*/
var matchedClients = [];

// Flag, true if matching function is running
var matching = false;

io.on("connection", function(socket) {
	socket.on("new client", function(obj, cb) {
		cb("matching you with a stranger ...");
		addUnmatchedClient(obj.nickname, socket);

		if(!matching && unmatchedClients.length > 1) {
			match();
		}
	});

	socket.on("send message", function(data, cb) {
		sendMessage(data, socket, cb);
	});

	socket.on("disconnect", function(reason) {
		let i = getObjectIndexByPropVal("socketId", socket.id, matchedClients);

		let matchedNames = matchedClients.map((val) => val.nickname);
		let unmatchedNames = unmatchedClients.map((val) => val.nickname);
		
		if (i > -1) {
			let partnerId = matchedClients[i]["partnerId"];
			matchedClients.splice(i, 1);
			socket.to(partnerId).emit("your partner disconnected");
		}
		// Since the disconnected client was not matched, it must be unmatched
		else if ( (i = getObjectIndexByPropVal("socketId", socket.id, unmatchedClients)) > -1) {
			let partnerId = unmatchedClients[i]["partnerId"];
			unmatchedClients.splice(i, 1);
			socket.to(partnerId).emit("your partner disconnected");
		} else {
			console.log("Client disconnected and was neither matched nor unmatched.");
		}

		// matchedNames = matchedClients.map((val) => val.nickname);
		// unmatchedNames = unmatchedClients.map((val) => val.nickname);
		// console.log("Matched after splice: ", matchedNames);
		// console.log("Unmatched after splice: ", unmatchedNames);
	});

	socket.on("vote/disconnect", (data, cb) => {
		let voterIndex = getObjectIndexByPropVal("socketId", socket.id, matchedClients);
		let partnerNickname;

		if (voterIndex > -1) {
			let partnerId = matchedClients[voterIndex].partnerId;
			let partnerIndex = getObjectIndexByPropVal("socketId", partnerId, matchedClients);

			if (partnerIndex > -1) {
				partnerNickname = matchedClients[partnerIndex].nickname;
			} else {
				console.log("Could not find client who voted.");
			}
		} else {
			console.log("Could not find client who voted.");
		}

		if (data.vote && data.vote === "up") {
			vote(partnerNickname, "up", cb);
		} else if (data.vote && data.vote === "down") {
			vote(partnerNickname, "down", cb);
		} else {
			console.log("Vote was neither up nor down.");
		}
	});
});

function addUnmatchedClient(nickname, socket) {
	let socketId = socket.id;
	let timeout;

	let clientIsInArray = !!unmatchedClients.find( obj => obj.nickname === nickname );

	if (!clientIsInArray) {
		//clearTimeout(timeout);
		unmatchedClients.push({nickname, socketId});
	}

	timeout = setTimeout(() => {
		let clientIsInArray = !!unmatchedClients.find( obj => obj["nickname"] === nickname );
		if (clientIsInArray) {
			// let i = getObjectIndexByPropVal("nickname", nickname, unmatchedClients);
			// unmatchedClients.splice(i, 1);

			// commenting the above two lines because this .emit causes a .disconnect on client
			socket.emit("could not find match");
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

let getRating = (thumbsUp, thumbsDown) => {
	let total = thumbsUp + thumbsDown;
	return (thumbsUp / total) || 0.5;
};

function match() {
	matching = true;
	var user1 = getDifferentItemFromArray(unmatchedClients, null);
	var user2 = getDifferentItemFromArray(unmatchedClients, user1);

	if ( !(user1 && user2) ) {
		matching = false;
		return;
	}

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
				result[i].rating = getRating(result[i].thumbsUp, result[i].thumbsDown);

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
			    if (Math.abs(a[0].rating - a[1].rating) <= DIFFERENCE && areConnectionsOpen) {
					a[0].partnerId = a[1].socketId;
					a[1].partnerId = a[0].socketId;

					// Remove the matched users from `unmatchedClients`
					for (let i = 0; i < a.length; i++) {
						let index = getObjectIndexByPropVal("nickname", a[i].nickname, unmatchedClients);
						if (index > -1) unmatchedClients.splice(index, 1);
					}

					// Add them to `matchedClients`
					matchedClients.push(a[0], a[1]);

					// Tell them they matched
					io.to(a[0].socketId).emit("new match");
					io.to(a[1].socketId).emit("new match");
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

	let message = data.message;
	let sender = matchedClients.find(elt => {
		return elt.socketId === socket.id;
	});

	let to = sender.partnerId;

	socket.broadcast.to(to).emit('new message', { message });

	cb("message sent");
}

let vote = (partnerNickname, vote, cb) => {

	let callback = (err, result) => {
		if (err) {
			console.log(err);
		}

		if (result.ok === 1) {
			// Tell client
			cb("success");
		}
	}

	let field = vote === "up" ? "thumbsUp" : "thumbsDown";

	let filter = { "nickname": partnerNickname };

	let update = {
		$inc: { [field]: 1 }
	};

	db.then(function(client) {
		let db = client.db("lolchat");
		var users = db.collection("users").findOneAndUpdate( filter, update, null, callback );
	});
};



http.listen(3000);