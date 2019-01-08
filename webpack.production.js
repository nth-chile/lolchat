var merge = require("webpack-merge");
const common = require("./webpack.common.js");
var path = require("path");

var config = {
  entry: {
    app: [path.resolve(__dirname, "src") + "/index.js"],
  },
  mode: "production",
};

module.exports = merge(common, config);
