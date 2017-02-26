const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { CheckerPlugin, TsConfigPathsPlugin } = require('awesome-typescript-loader');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

const postcssConfig = require('./postcss.config');
const babelConfig = require('./babel.config');

// TODO production config
const NODE_ENV = process.env.NODE_ENV || 'development';
// const DEBUG = NODE_ENV === 'development';
const PROD = NODE_ENV === 'production';

const extractCSS = new ExtractTextPlugin('styles.css');

function makePlugins(cfg) {
  return [
    new LodashModuleReplacementPlugin({
      collections: true,
      paths: true,
    }),

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

    new CaseSensitivePathsPlugin(),
  ];
}

function makeRules() {
  return [
    // Disable require.ensure as it's not a standard language feature.
    { parser: { requireEnsure: false } },
    {
      test: /\.json$/,
      loader: 'json-loader',
    },
    {
      test: /\.jsx?$/,
      loader: 'babel-loader',
      options: {
        babelrc: false,
        presets: babelConfig,
        // This is a feature of `babel-loader` for webpack (not Babel itself).
        // It enables caching results in ./node_modules/.cache/babel-loader/
        // directory for faster rebuilds.
        cacheDirectory: true,
      },
    },
    {
      test: /\.tsx?$/,
      loader: 'awesome-typescript-loader',
    },
    {
      test: /\.s?css$/,
      use: extractCSS.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            query: {
              sourceMap: true,
              modules: true,
              importLoaders: 1,
              localIdentName: '[local]',
            },
          },
          'sass-loader',
          {
            loader: 'postcss-loader',
            options: postcssConfig,
          },
        ],
      }),
    },
    // "file" loader makes sure those assets get served by WebpackDevServer.
    // When you `import` an asset, you get its (virtual) filename.
    // In production, they would get copied to the `build` folder.
    {
      test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
      loader: 'file-loader',
      query: {
        name: 'static/media/[name].[hash:8].[ext]',
      },
    },
    // "url" loader works just like "file" loader but it also embeds
    // assets smaller than specified size as data URLs to avoid requests.
    {
      test: /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/,
      loader: 'url-loader',
      query: {
        limit: 10000,
        name: 'static/media/[name].[hash:8].[ext]',
      },
    },
  ];
}

function appEntry(config) {
  if (_.isArray(config.entry)) {
    return config.entry;
  }
  return _.isString(config.entry) ? config.entry : './src/index';
}

function makeEntry(config) {
  return {
    vendor: [
      'webpack-hot-middleware/client',
      'babel-polyfill',
      'isomorphic-fetch',
      // TODO add custom polyfills
    ],
    app: appEntry(config),
  };
}

module.exports = function makeConfig(appConfig) {
  const config = appConfig || {};
  const cwd = config.cwd || process.cwd();
  const plugins = makePlugins(config).filter(_.identity);
  const rules = makeRules();
  const entry = makeEntry(config);

  const base = {
    devtool: 'source-map',
    entry,
    output: {
      path: path.join(cwd, 'static'),
      filename: '[name].bundle.js',
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      publicPath: '/static/',
    },
    plugins,
    module: {
      rules,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss'],
    },
    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
    },
  };

  return Object.assign({}, base, _.omit(config, ['cwd', 'jquery', 'entry']));
};
