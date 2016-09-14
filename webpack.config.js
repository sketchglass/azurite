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
    "receive-tablet-event": true,
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
      {
        test: /\.(scss|sass)$/,
        loader: "style-loader!css-loader!sass-loader"
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      },
      {
        test: /\.(jpg|png|woff|woff2|eot|ttf|svg)/,
        loader: 'url-loader?limit=10000'
      }
    ],
  },
  devtool: "inline-source-map",
}
