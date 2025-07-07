var path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/client/index.js',
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/'
  },

  resolve: {
    extensions: ['.js', '.jsx']
  },
  
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
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