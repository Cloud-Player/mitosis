const path = require('path');
const webpack = require('webpack');

const dev = process.env.NODE_ENV !== 'production';

const DefinePluginConfig = new webpack.DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify('production'),
});

const publicPath = '/';

module.exports = {
  entry: [
    path.join(__dirname, '/index.ts')
  ],
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        exclude: /node_modules/,
        loaders: ['ts-loader'],
      },
      {
        test: /\.ts$/,
        enforce: 'pre',
        use: [
          {
            loader: 'tslint-loader',
            options: {/* Loader options go here */}
          }
        ]
      },
      {
        test: /\.js?$/,
        use: ["source-map-loader"],
        enforce: "pre"
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist'),
    publicPath: publicPath
  },
  mode: dev ? 'development' : 'production',
  plugins: dev
    ? [
      new webpack.HotModuleReplacementPlugin(),
    ]
    : [DefinePluginConfig],
};
