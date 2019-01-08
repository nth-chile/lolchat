var webpack = require("webpack");
var merge = require("webpack-merge");
const common = require("./webpack.common.js");
var path = require("path");

var config = {
  devServer: {
    contentBase: path.resolve(__dirname, "dist"),
    hot: true
  },
  devtool: "source-map",
  entry: {
    app: [path.resolve(__dirname, "src") + "/index.js", "webpack-hot-middleware/client"],
  },
  mode: "development",
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
};

module.exports = merge(common, config);
