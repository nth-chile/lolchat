var webpack = require("webpack");
var path = require("path");

var config = {
	entry: {
		app: path.resolve(__dirname, "src") + "/index.js"	
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "bundle.js"
	},
	module: {
		rules: [
			{
				test: /\.js?/,
				exclude: /node_modules/,
				use: [
				{
			        loader: "babel-loader",
			        options: {
			        	presets: ["react", "env"]
			        }
			    }
		      ]
			}
		]
	}
};

module.exports = config;
