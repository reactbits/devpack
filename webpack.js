const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

// TODO production config
const NODE_ENV = process.env.NODE_ENV || 'development';

// TODO allow to customize css loader
const cssLoader = 'css?sourceMap&modules&importLoaders=1&localIdentName=[local]';

// TODO customize loaders

module.exports = function makeConfig(options) {
	if (!options) options = {}; // eslint-disable-line

	const plugins = [
		new ExtractTextPlugin('styles.css', { allChunks: true }),
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoErrorsPlugin(),
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify(NODE_ENV),
			},
		}),
	];

	if (options.jquery === true) {
		plugins.push(new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery',
			'window.jQuery': 'jquery',
		}));
	}

	const entry = _.isArray(options.entry) ? options.entry : [
		'webpack-hot-middleware/client',
		_.isString(options.entry) ? options.entry : './src/index',
	];

	const config = {
		devtool: 'source-map',
		entry: entry, // eslint-disable-line
		output: {
			path: path.join(__dirname, 'static'),
			filename: 'bundle.js',
			publicPath: '/static/',
		},
		plugins: plugins, // eslint-disable-line
		module: {
			loaders: [
				{
					test: /\.json$/,
					loader: 'json',
				},
				{
					test: /\.jsx?$/,
					loader: 'babel',
					exclude: /node_modules/,
				},
				{
					test: /\.(scss|css)$/,
					loader: ExtractTextPlugin.extract('style', [cssLoader, 'postcss', 'sass?sourceMap']),
				},
				{
					test: /\.less$/,
					loader: ExtractTextPlugin.extract('style', [cssLoader, 'postcss', 'less?sourceMap']),
				},
				{
					test: /\.(ttf|eot|svg|woff(2)?)$/,
					loader: 'file-loader',
				},
			],
		},
		resolve: {
			extensions: ['', '.js', '.jsx', '.json', '.css', '.scss', '.less'],
		},
		postcss: [autoprefixer],
	};

	return _.merge(config, options.config || {});
};
