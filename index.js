const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const webpack = require('webpack');
const makeConfig = require('./webpack');
const proxyMiddleware = require('http-proxy-middleware');

function makeDefaultConfig(cwd) {
  const f = path.join(cwd, 'webpack.config.js');
  const t = fs.statSync(f);
  return t.isFile ? require(f) : makeConfig(); // eslint-disable-line
}

function start(opts) {
  const options = opts || {};
  const port = options.port || process.env.PORT || 8000;
  const cwd = options.cwd || process.cwd();
  const config = options.webpack || makeDefaultConfig(cwd);

  const app = express();
  const compiler = webpack(config);

  app.use(morgan('dev'));
  app.use(cors());
  app.use(helmet());

  function useProxy(set) {
    const spec = _.assign({}, set);
    const context = spec.context || spec.path;
    if (!context) {
      throw new Error('missing context in proxy options');
    }
    const proxyOptions = _.omit(spec, ['context', 'path']);
    app.use(proxyMiddleware(context, proxyOptions));
  }

  if (_.isString(options.proxy)) {
    app.use(proxyMiddleware(options.proxy));
  } else if (_.isArray(options.proxy)) {
    options.proxy.forEach(useProxy);
  } else if (_.isObject(options.proxy)) {
    useProxy(options.proxy);
  }

  if (_.isFunction(options.initApp)) {
    options.initApp(app);
  }

  app.use(cookieParser());

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }));

  // parse application/json
  app.use(bodyParser.json());

  function logErrors(err, req, res, next) {
    if (err) {
      console.error(err.stack);
    }
    next(err);
  }
  app.use(logErrors);

  const devMiddleware = require('webpack-dev-middleware'); // eslint-disable-line
  app.use(devMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath,
    stats: 'errors-only',
  }));

  const hotMiddleware = require('webpack-hot-middleware'); // eslint-disable-line
  app.use(hotMiddleware(compiler));

  if (_.isFunction(options.extendApp)) {
    options.extendApp(app);
  }

  if (_.isFunction(options.api)) {
    app.use(options.api());
  } else if (_.isObject(options.api)) {
    app.use(options.api);
  }

  app.use(express.static(cwd));

  // otherwise return index.html
  app.get('/*', (req, res) => {
    res.sendFile(path.join(cwd, 'index.html'));
  });

  app.use((err, req, res, next) => { // eslint-disable-line
    if (err) {
      console.log(err);
      res.status(500).send('bad code path');
    }
  });

  app.listen(port, '0.0.0.0', (err) => {
    if (err) {
      console.log(err);
      return;
    }

    console.log('Listening at http://0.0.0.0:%s', port);
  });
}

module.exports = {
  startServer: start,
  makeWebpackConfig: makeConfig,
};
