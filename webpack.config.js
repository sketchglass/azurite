module.exports = {
  entry: {
    renderer: "./src/renderer/index.tsx",
    dialogs: "./src/renderer/views/dialogs/DialogIndex.tsx",
  },
  output: {
    path: "./dist/assets",
    publicPath: "/assets/",
    filename: '[name].js',
  },
  target: "electron-renderer",
  node: {
    __filename: false,
    __dirname: false,
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
  plugins: [
    require("webpack-fail-plugin"),
  ],
  postcss: function(webpack) {
    return [
      require('postcss-import')({
        addDependencyTo: webpack
      }),
      require('postcss-url'),
      require('postcss-cssnext')({
        features: {
          customProperties: false,
        },
      }),
    ];
  },
  devtool: "inline-source-map",
  devServer: {
    contentBase: './dist',
    port: 23000,
    inline: true,
  },
}
