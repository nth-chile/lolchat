var path = require("path");
var express = require("express");
var app = express();
var	http = require("http").Server(app);
var io = require("socket.io")(http);
var webpack = require("webpack");
var config = require("./webpack.config.js");

var DIST_DIR = path.join(__dirname, "dist"),
    PORT = 3000;

var compiler = webpack(config);
var webpackDevMiddleware = require("webpack-dev-middleware")(
	compiler,
	config.devServer
);
var webpackHotMiddleware = require("webpack-hot-middleware")(compiler);

app.use(webpackDevMiddleware);
app.use(webpackHotMiddleware);
app.use(express.static(DIST_DIR));


// Routes
app.get("*", function (req, res) {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.get('/api/signup', function(req, res) {
  signUp(req, res);
})

io.on("connection", function(socket) {
	console.log('a user connected');
});

app.listen(PORT, function() {
	console.log('listening on port 3000.')
});