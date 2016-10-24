module.exports = {
  entry: "./src/main/index.ts",
  output: {
    path: "./dist/assets",
    filename: 'main.js',
    libraryTarget: "commonjs",
  },
  target: "node",
  node: {
    __filename: false,
    __dirname: false,
  },
  externals: {
    electron: true,
    "receive-tablet-event": true,
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
}
