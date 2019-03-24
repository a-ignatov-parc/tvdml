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

module.exports = {
  entry: resolveFromRoot('./src'),
  output: {
    library: 'TVDML',
    libraryTarget: 'umd',
    filename: 'tvdml.js',
    path: resolveFromRoot('./dist'),
    globalObject: 'this', // tvjs doesn't have window object
  },
  devtool: isProd ? 'source-map' : 'eval-source-map',
  mode: isProd ? 'production' : 'development',
  externals: ['react'], // peerDependencies
  module: { rules },
  plugins,
  stats,
};
