/* eslint-env node */
const webpack = require("webpack");
const _ = require("lodash");

const config = _.cloneDeep(require("./webpack.config.js"));

config.output.pathinfo = false;
config.devtool = false;

config.plugins = config.plugins.concat([
  new webpack.LoaderOptionsPlugin({
    minimize: true,
    debug: false,
  }),
  new webpack.DefinePlugin({
    "process.env.NODE_ENV": JSON.stringify("production"),
  }),
  new webpack.optimize.UglifyJsPlugin(),
  new webpack.NoEmitOnErrorsPlugin(),
]);

module.exports = config;
