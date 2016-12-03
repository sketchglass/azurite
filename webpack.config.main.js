module.exports = {
  entry: "./src/main/index.ts",
  output: {
    path: "./dist/assets",
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
  },
  resolve: {
    extensions: ["", ".ts", ".js"],
  },
  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
      },
    ],
  },
  plugins: [
    require("webpack-fail-plugin"),
  ],
}
