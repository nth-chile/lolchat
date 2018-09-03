var webpack = require("webpack");
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
	plugins: [
		new webpack.HotModuleReplacementPlugin()
	]
};

module.exports = config;
