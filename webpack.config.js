'use strict';

const path = require('path');

module.exports = {
	entry: './src/index.js',
	output: {
		library: 'TVDML',
		libraryTarget: 'umd',
		filename: 'tvdml.js',
		path: path.resolve(__dirname, 'dist'),
	},
	devtool: 'source-map',
	target: 'web',
	module: {
		loaders: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
			},
		],
	},
};
