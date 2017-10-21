'use strict';

const path = require('path');
const webpack = require('webpack');

function resolveFromRoot(dir) {
  return path.resolve(__dirname, dir);
}

const DEVELOPMENT = 'development';
const PRODUCTION = 'production';

const env = process.env.NODE_ENV || DEVELOPMENT;

const isProd = env === PRODUCTION;

const rules = [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: [
          ['env', {
            useBuiltIns: true,
            modules: false,
          }],
        ],
        plugins: [
          'transform-class-properties',
          'transform-object-rest-spread',
        ],
        cacheDirectory: true,
      },
    },
  },
];

const stats = {
  modules: false,
  chunks: false,
  colors: true,
};

const plugins = [
  new webpack.EnvironmentPlugin({
    NODE_ENV: DEVELOPMENT,
  }),
];

if (isProd) {
  plugins.push(...[
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        keep_fnames: true,
        screw_ie8: true,
        warnings: false,
      },
      output: {
        comments: false,
      },
      mangle: {
        keep_fnames: true,
      },
      sourceMap: true,
    }),
  ]);
}

module.exports = {
  entry: resolveFromRoot('./src'),
  output: {
    library: 'TVDML',
    libraryTarget: 'umd',
    filename: 'tvdml.js',
    path: resolveFromRoot('./dist'),
  },
  devtool: isProd ? 'source-map' : 'eval-source-map',
  module: { rules },
  plugins,
  stats,
};
