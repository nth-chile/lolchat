var path = require("path");
var express = require("express");
var app = express();
var	http = require("http").Server(app);
var io = require("socket.io")(http);
var webpack = require("webpack");
var config = require("./webpack.config.js");
var compiler = webpack(config);


app.use(require("webpack-dev-middleware")(
	compiler,
	config.devServer
));
app.use(require("webpack-hot-middleware")(compiler));
app.use(express.static(path.join(__dirname, "dist")));


// Routes
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

app.post("/action/signup", function(req, res) {
  console.log(req, res);
  // res.json({
  // 	req, res
  // })
  res.send("ok")
  console.log(req, res)

  console.log('asdfsadfsaf')
})

// io.on("connection", function(socket) {
// 	console.log('a user connected');
// });

app.listen(3000, function() {
	console.log('listening on port 3000.');
});