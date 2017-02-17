const commonEntries = ["./src/renderer/requireManualResolve.ts"]

module.exports = {
  entry: {
    renderer: [...commonEntries, "./src/renderer/index.tsx"],
    dialogs: [...commonEntries, "./src/renderer/views/dialogs/DialogIndex.tsx"],
    preferences: [...commonEntries, "./src/renderer/views/preferences/PreferencesIndex.tsx"],
    test: [...commonEntries, "./src/test/index.js"],
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
  externals: {
    "glslify": "undefined", // glslify will be transformed with babel-plugin-glslify so don't have to be required
    "nbind": "requireManualResolve('nbind')",
    "keyboard-layout": "requireManualResolve('keyboard-layout')",
  },
  resolve: {
    extensions: ["", ".ts", ".tsx", ".js"],
  },
  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.tsx?$/,
        exclude: /Test\.tsx?$/,
        loader: "babel-loader?plugins[]=glslify!ts-loader",
      },
      {
        test: /Test\.tsx?$/,
        loader: "babel-loader?plugins[]=espower!ts-loader",
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
  postcss: (webpack) => {
    return [
      require('postcss-import'),
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
