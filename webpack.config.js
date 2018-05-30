const path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: { main: './src/app/app.module.js' },
  // output: {
  //   path: path.resolve(__dirname, 'dist/scripts'),
  //   filename: 'main.js'
  // },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }, {
        test: /\.html$/,
        use: [ {
          loader: 'html-loader',
          options: {
            minimize: true
          }
        }],
      }
    ]
  }
};
