var path = require("path");
var express = require("express");
var app = express();
var	http = require("http").Server(app);
var io = require("socket.io")(http);

var DIST_DIR = path.join(__dirname, "dist"),
    PORT = 3000;

//Serving the files on the dist folder
app.use(express.static(DIST_DIR));

//Send index.html when the user access the web
app.get("*", function (req, res) {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

io.on("connection", function(socket) {
	console.log('a user connected');
});

app.listen(PORT, function() {
	console.log('listening on port 3000.')
});