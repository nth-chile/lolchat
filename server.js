var path = require("path");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var	http = require("http").Server(app);
var io = require("socket.io")(http);
var webpack = require("webpack");
var config = require("./webpack.config.js");
var compiler = webpack(config);
var bcrypt = require("bcrypt");

require('dotenv').config()

var MongoClient = require("mongodb").MongoClient;
var assert = require('assert');
const dbURL = `mongodb://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@ds125862.mlab.com:25862/lolchat`;

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

 	MongoClient.connect(dbURL, function(err, client) {
		assert.equal(null, err); // ??

		const db = client.db("lolchat");

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
						
						client.close();
					});
				}

				catch (e) {
					res.send({
						error: e,
						action: "LOGIN_FAILURE_UNKNOWN_ERROR"
					});
					client.close();
				}
			} else {
				res.send({
					action: "ACCOUNT_NONEXISTENT"
				});
				client.close();
			}
		});
	});
});

app.post("/action/signup", function(req, res) {
	var nickname = req.body.nickname;
	var password = req.body.password;

 	MongoClient.connect(dbURL, function(err, client) {
		assert.equal(null, err); // ??

		const db = client.db("lolchat");

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
							client.close();
					  	});
					});
				}

				catch (e) {
					res.send({
						error: e,
						action: "REGISTRAION_FAILURE_UNKNOWN_ERROR"
					});
					client.close();
				}
			} else {
				res.send({
					action: "NICKNAME_IN_USE"
				});
				client.close();
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
		addUnmatchedClient(obj.nickname);
		!matching && match();
	});
});

function addUnmatchedClient(nickname) {
	unmatchedClients.push(nickname);
	setTimeout(() => {
		let i = unmatchedClients.indexOf(nickname);
		if (i > -1) unmatchedClients.splice(i, 1);
	}, TIMEOUT);
}

function getDifferentItemFromArray(arr, value) {
	var item = arr[Math.floor(Math.random() * arr.length)];
	if (item !== value) return item;
	return getDifferentItemFromArray(arr, value);
}

function match() {
	matching = true;
	var user1 = getDifferentItemFromArray(unmatchedClients, null);
	var user2 = getDifferentItemFromArray(unmatchedClients, user1);

	var user1Rating, user2Rating;

	//dbcall must be synchronous?

	if (Math.abs(user1Rating - user2Rating) < DIFFERENCE && "connection is open") {
		let i = unmatchedClients.indexOf(user1);
		if (i > -1) unmatchedClients.splice(i, 1);
		i = unmatchedClients.indexOf(user2);
		if (i > -1) unmatchedClients.splice(i, 1);

		
	}

	if (unmatchedClients < 2) {
		matching = false;
	} else {
		match();
	}
}



http.listen(3000);
// app.listen(3000, function() {
// 	console.log('listening on port 3000.');
// });