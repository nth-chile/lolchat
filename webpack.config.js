var webpack = require("webpack");
var path = require("path");

var config = {
	devServer: {
		contentBase: path.resolve(__dirname, "dist"),
		hot: true
	},
	entry: {
		app: path.resolve(__dirname, "src") + "/index.js"	
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "bundle.js",
		publicPath: path.resolve(__dirname, "dist")
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
	plugins: [
		new webpack.HotModuleReplacementPlugin()
	]
};

module.exports = config;
