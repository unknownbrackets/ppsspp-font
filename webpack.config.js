const path = require('path');

module.exports = {
	devtool: 'cheap-module-source-map',

	entry: './app/editor.js',

	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
	},

	module: {
		rules: [
			{
				test: /\.js?$/,
				exclude: /(node_modules|bower_components)/,
				use: [
					{ loader: 'babel-loader' },
				],
			},
		],
	},

	resolve: {
		modules: ['node_modules'],
	},
};
