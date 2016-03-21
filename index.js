const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const webpack = require('webpack');
const makeConfig = require('./webpack');

function makeDefaultConfig(cwd) {
	const f = path.join(cwd, 'webpack.config.js');
	const t = fs.statSync(f);
	return t.isFile ? require(f) : makeConfig();
}

function start(options) {
	const port = options.port || process.env.PORT || 8000;
	const cwd = options.cwd || process.cwd();
	const config = options.webpack || makeDefaultConfig(cwd);

	const app = express();
	const compiler = webpack(config);

	app.use(morgan('dev'));
	app.use(cors());

	app.use(require('webpack-dev-middleware')(compiler, {
		noInfo: true,
		publicPath: config.output.publicPath,
		stats: 'errors-only',
	}));

	app.use(require('webpack-hot-middleware')(compiler));

	if (_.isFunction(options.extendApp)) {
		options.extendApp(app);
	}

	if (_.isFunction(options.api)) {
		app.use(options.api());
	} else if (_.isObject(options.api)) {
		app.use(options.api);
	}

	app.use(express.static(cwd));

	// TODO allow to override index route (isomorphic apps)
	// otherwise serve index.html
	app.get('*', (req, res) => {
		res.sendFile(path.join(cwd, 'index.html'));
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
