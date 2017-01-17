const webpack = require("webpack");

module.exports = {
  entry: "./index.js",
  output: {
    path: "public",
    filename: "bundle.js",
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel",
        query: {
          presets: ["latest"],
        },
      },
      {
        test: /\.json$/,
        loader: "json",
      },
    ],
  },
  devtool: "source-map",
};
