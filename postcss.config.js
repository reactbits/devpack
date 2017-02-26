const precsss = require('precss');
const autoprefixer = require('autoprefixer');

module.exports = {
  ident: 'postcss', // https://webpack.js.org/guides/migrating/#complex-options
  syntax: 'postcss-scss',
  map: 'inline',
  plugins: [
    precsss,
    autoprefixer({
      browsers: [
        '>1%',
        'last 4 versions',
        'Firefox ESR',
        'not ie < 9', // React doesn't support IE8 anyway
      ],
    }),
  ],
};
