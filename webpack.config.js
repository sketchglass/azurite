module.exports = {
  entry: {
    main: "./src/main/index.ts",
    renderer: "./src/renderer/index.tsx",
  },
  output: {
    path: "./dist/assets",
    filename: '[name].js',
    libraryTarget: "commonjs",
  },
  target: "node",
  node: {
    __filename: false,
    __dirname: false,
  },
  externals: {
    electron: true,
  },
  resolve: {
    extensions: ["", ".ts", ".tsx", ".js"],
  },
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
      },
    ],
  },
}
