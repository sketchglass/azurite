module.exports = {
  entry: {
    main: "./src/main/index.ts",
    renderer: "./src/renderer/index.tsx",
    "dialogs/newPicture": "./src/dialogs/newPicture.tsx",
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
        test: /\.css$/,
        loader: 'style-loader!css-loader?importLoaders=1!postcss-loader'
      },
      {
        test: /\.(jpg|png|woff|woff2|eot|ttf|svg)/,
        loader: 'url-loader?limit=10000'
      }
    ],
  },
  postcss: function(webpack) {
    return [
      require('postcss-import')({
        addDependencyTo: webpack
      }),
      require('postcss-cssnext'),
    ];
  },
  devtool: "inline-source-map",
}
