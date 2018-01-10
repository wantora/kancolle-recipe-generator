/* eslint-env node */
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = (options) => {
  const production = options && options.production === "true";
  const plugins = [
    new webpack.LoaderOptionsPlugin({
      debug: true,
    }),
    new CopyWebpackPlugin([
      {from: "./src/www"},
    ]),
    new ExtractTextPlugin("[name].css"),
  ];
  
  if (production) {
    plugins.push(...[
      new webpack.optimize.ModuleConcatenationPlugin(),
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
  }
  
  return {
    entry: {
      bundle: "./src/main.js",
    },
    output: {
      path: path.join(__dirname, "dist"),
      filename: "[name].js",
      pathinfo: !production,
    },
    devtool: production ? false : "inline-source-map",
    plugins: plugins,
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          enforce: "pre",
          use: "eslint-loader",
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: "babel-loader",
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
};
