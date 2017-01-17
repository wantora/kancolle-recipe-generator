const webpack = require("webpack");

module.exports = Object.assign({}, require("./webpack.config.js"), {
  plugins: [
    new webpack.optimize.UglifyJsPlugin(),
  ],
});
