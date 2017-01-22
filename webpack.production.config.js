const webpack = require("webpack");
const _ = require("lodash");

const config = _.cloneDeep(require("./webpack.config.js"));

config.plugins.push(
  new webpack.DefinePlugin({
    "process.env": {
      NODE_ENV: JSON.stringify("production"),
    }
  })
);
config.devtool = null;

module.exports = config;
