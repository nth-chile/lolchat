var webpack = require("webpack");
var path = require("path");

var config = {
  module: {
    rules: [
      {
        test: /\.js?/,
        exclude: /node_modules/,
        use: [
        {
              loader: "babel-loader",
              options: {
                presets: ["react", "env"],
                plugins:[ 'transform-object-rest-spread' ]
              }
          }
          ]
      },
      {
        test: /\.s?css/,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader"
        ]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: path.resolve(__dirname, "dist")
  },
};

module.exports = config;
