const path = require("path")

module.exports = {
  entry: "./src/main/index.ts",
  output: {
    path: path.resolve(__dirname, "./dist/assets"),
    filename: 'main.js',
    libraryTarget: "commonjs",
  },
  target: "electron",
  node: {
    __filename: false,
    __dirname: false,
  },
  externals: {
    "receive-tablet-event": true,
    "electron-devtools-installer": true,
    "nbind": true,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    loaders: [
      {
        test: /\.ts$/,
        use: "ts-loader",
      },
    ],
  },
  plugins: [
    require("webpack-fail-plugin"),
  ],
}
