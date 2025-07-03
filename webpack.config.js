var path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/client/index.js',
  devtool: 'source-map', // Use source-map instead of eval

  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/'
  },

  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ["@babel/preset-env", "@babel/preset-react"]
        }
      }
    }]
  },

  devServer: {
    static: {
      directory: __dirname
    },
    compress: true,
    port: 8080,
    hot: true,
    historyApiFallback: true,
    open: false
  }
};
