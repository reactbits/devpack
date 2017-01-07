const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

// TODO production config
const NODE_ENV = process.env.NODE_ENV || 'development';
// const DEBUG = NODE_ENV === 'development';
const PROD = NODE_ENV === 'production';

// TODO allow to customize css loader
const cssLoader = 'css?sourceMap&modules&importLoaders=1&localIdentName=[local]';
const sassLoader = `${cssLoader}!postcss!sass?sourceMap`;
const lessLoader = `${cssLoader}!postcss!less?sourceMap`;

// TODO customize loaders
// TODO unuse ExtractTextPlugin in development mode

const uglifyOptions = {
  sourceMap: true,
  compressor: {
    warnings: false,
    dead_code: true,
  },
  output: {
    // preamble: banner,
    comments: 'all',
  },
  beautify: true,
  mangle: false,
};

module.exports = function makeConfig(config) {
  const cfg = config || {};
  const cwd = cfg.cwd || process.cwd();

  const plugins = [
    new ExtractTextPlugin('styles.css', { allChunks: true }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(NODE_ENV),
      },
    }),
    cfg.jquery === true ? new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }) : null,
    PROD ? new webpack.optimize.OccurenceOrderPlugin() : null,
    PROD ? new webpack.optimize.UglifyJsPlugin(uglifyOptions) : null,
  ].filter(_.identity);

  if (cfg.jquery === true) {
    delete cfg.jquery;
  }

  const babelPolyfillEntry = 'babel-polyfill';
  const webpackEntry = 'webpack-hot-middleware/client';
  const appEntry = () => {
    if (_.isArray(cfg.entry)) {
      return cfg.entry;
    }
    return _.isString(cfg.entry) ? cfg.entry : './src/index';
  };
  const entry = [babelPolyfillEntry, webpackEntry].concat(appEntry());

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
    },
    {
      test: /\.(scss|css)$/,
      // loader: `style!${sassLoader}`,
      // loader: PROD ? ExtractTextPlugin.extract('style', sassLoader) : `style!${sassLoader}`,
      loader: ExtractTextPlugin.extract('style', sassLoader),
    },
    {
      test: /\.less$/,
      // loader: `style!${lessLoader}`,
      // loader: PROD ? ExtractTextPlugin.extract('style', lessLoader) : `style!${lessLoader}`,
      loader: ExtractTextPlugin.extract('style', lessLoader),
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
      path: path.join(cwd, 'static'),
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
