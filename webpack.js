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

module.exports = function makeConfig(config) {
	const cfg = config || {};

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

	if (cfg.jquery === true) {
		plugins.push(new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery',
			'window.jQuery': 'jquery',
		}));
		delete cfg.jquery;
	}

	const webpackEntry = 'webpack-hot-middleware/client';
	const entry = _.isArray(cfg.entry) ? [webpackEntry].concat(cfg.entry) : [
		webpackEntry,
		_.isString(cfg.entry) ? cfg.entry : './src/index',
	];
	if (cfg.entry) {
		delete cfg.entry;
	}

	const loaders = [
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
			test: /\.tsx?$/,
			loaders: ['react-hot', 'ts-loader?instance=jsx'],
			include: path.resolve(__dirname, 'src'),
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
			test: /\.(jpg|png|gif|svg|eot|ttf|woff(2)?)$/,
			loader: 'file-loader?name=[name].[ext]',
		},
	];

	const base = {
		devtool: 'source-map',
		entry: entry, // eslint-disable-line
		output: {
			path: path.join(__dirname, 'static'),
			filename: 'bundle.js',
			publicPath: '/static/',
		},
		plugins: plugins, // eslint-disable-line
		module: {
			loaders: loaders, // eslint-disable-line
		},
		resolve: {
			extensions: ['', '.js', '.jsx', '.json', '.css', '.scss', '.less'],
		},
		postcss: [autoprefixer],
	};

	return _.merge(base, cfg || {});
};
