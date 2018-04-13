"use strict";

const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = (env, argv) => {
  const config = {
    entry: {
      bundle: "./src/main.js",
    },
    output: {
      path: path.join(__dirname, "dist"),
      filename: "[name].js",
    },
    plugins: [
      new CopyWebpackPlugin([{from: "./src/www"}]),
      new ExtractTextPlugin("[name].css"),
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          type: "javascript/esm",
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          enforce: "pre",
          use: "eslint-loader",
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: {
                      browsers: [
                        "last 2 versions",
                        "Firefox ESR",
                        "not IE <=10",
                      ],
                    },
                    modules: false,
                    useBuiltIns: "usage",
                  },
                ],
                "@babel/preset-react",
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: {
              loader: "css-loader",
              options: {
                sourceMap: true,
              },
            },
          }),
        },
        {
          test: /\.(jpg|png|woff2?|ttf|eot|svg)$/,
          use: {
            loader: "file-loader",
            options: {
              name: "res/[name].[ext]",
            },
          },
        },
      ],
    },
  };

  if (argv.mode === "development") {
    config.devtool = "inline-source-map";
  }

  return config;
};
