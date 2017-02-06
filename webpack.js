const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { CheckerPlugin, TsConfigPathsPlugin } = require('awesome-typescript-loader');

// TODO production config
const NODE_ENV = process.env.NODE_ENV || 'development';
// const DEBUG = NODE_ENV === 'development';
const PROD = NODE_ENV === 'production';

const extractCSS = new ExtractTextPlugin('styles.css');

function makePlugins(cfg) {
  return [
    extractCSS,

    new TsConfigPathsPlugin(),

    /*
    * Plugin: ForkCheckerPlugin
    * Description: Do type checking in a separate process, so webpack don't need to wait.
    *
    * See: https://github.com/s-panferov/awesome-typescript-loader#forkchecker-boolean-defaultfalse
    */
    new CheckerPlugin(),

    /*
    * Plugin: CommonsChunkPlugin
    * Description: Shares common code between the pages.
    * It identifies common modules and put them into a commons chunk.
    *
    * See: https://webpack.github.io/docs/list-of-plugins.html#commonschunkplugin
    * See: https://github.com/webpack/docs/wiki/optimization#multi-page-app
    */
    new webpack.optimize.CommonsChunkPlugin({
      name: ['hmr', 'polyfills', 'vendor'],
    }),

    new webpack.HotModuleReplacementPlugin(),

    new webpack.NoEmitOnErrorsPlugin(),

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

    // This helps ensure the builds are consistent if source hasn't changed:
    PROD ? new webpack.optimize.OccurrenceOrderPlugin() : null,
    // Try to dedupe duplicated modules, if any:
    PROD ? new webpack.optimize.DedupePlugin() : null,
  ];
}

function makeLoaders() {
  return [
    {
      test: /\.json$/,
      loader: 'json',
    },
    {
      test: /\.jsx?$/,
      loader: 'babel-loader',
      query: {
        cacheDirectory: true,
      },
    },
    {
      test: /\.tsx?$/,
      loader: 'awesome-typescript-loader',
    },
    {
      test: /\.s?css$/,
      loader: extractCSS.extract([
        {
          loader: 'css-loader',
          query: {
            sourceMap: true,
            modules: true,
            importLoaders: 1,
            localIdentName: '[local]',
          },
        },
        'postcss-loader',
      ]),
    },
    // "file" loader makes sure those assets get served by WebpackDevServer.
    // When you `import` an asset, you get its (virtual) filename.
    // In production, they would get copied to the `build` folder.
    {
      test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
      loader: 'file',
      query: {
        name: 'static/media/[name].[hash:8].[ext]',
      },
    },
    // "url" loader works just like "file" loader but it also embeds
    // assets smaller than specified size as data URLs to avoid requests.
    {
      test: /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/,
      loader: 'url',
      query: {
        limit: 10000,
        name: 'static/media/[name].[hash:8].[ext]',
      },
    },
  ];
}

function appEntry(cfg) {
  if (_.isArray(cfg.entry)) {
    return cfg.entry;
  }
  return _.isString(cfg.entry) ? cfg.entry : './src/index';
}

function makeEntry(cfg) {
  return {
    vendor: [
      'webpack-hot-middleware/client',
      'babel-polyfill',
      'isomorphic-fetch',
      // TODO add custom polyfills
    ],
    app: appEntry(cfg),
  };
}

module.exports = function makeConfig(config) {
  const cfg = config || {};
  const cwd = cfg.cwd || process.cwd();
  const plugins = makePlugins(cfg).filter(_.identity);
  const loaders = makeLoaders();
  const entry = makeEntry(cfg);

  const base = {
    devtool: 'source-map',
    entry: entry, // eslint-disable-line
    output: {
      path: path.join(cwd, 'static'),
      /**
       * Specifies the name of each output file on disk.
       * IMPORTANT: You must not specify an absolute path here!
       *
       * See: http://webpack.github.io/docs/configuration.html#output-filename
       */
      filename: '[name].bundle.js',
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      publicPath: '/static/',
    },
    plugins: plugins, // eslint-disable-line
    module: {
      loaders: loaders, // eslint-disable-line
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.less'],
    },
  };

  return Object.assign({}, base, _.omit(cfg, ['cwd', 'jquery', 'entry']));
};
