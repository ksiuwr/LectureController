const webpack = require('webpack');
const path = require('path');

const config = {
  entry: {
    app: './js/app.js',
  },
  output: {
    filename: '[name].min.js',
    path: path.resolve(__dirname, 'dist/')
  },
  plugins: [
    new webpack.ProgressPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: ["@babel/plugin-proposal-class-properties"],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};

module.exports = config;