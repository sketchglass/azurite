const path = require("path")
const webpack = require("webpack")
const {CheckerPlugin} = require('awesome-typescript-loader')
const commonEntries = ["./src/renderer/requireManualResolve.ts"]

module.exports = {
  entry: {
    renderer: [...commonEntries, "./src/renderer/index.ts"],
    dialogs: [...commonEntries, "./src/renderer/views/dialogs/DialogIndex.tsx"],
    preferences: [...commonEntries, "./src/renderer/views/preferences/PreferencesIndex.tsx"],
    test: [...commonEntries, "./src/test/index.js"],
  },
  output: {
    path: path.resolve(__dirname, "./dist/assets"),
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
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    loaders: [
      {
        test: /\.json$/,
        use: 'json-loader',
      },
      {
        test: /\.tsx?$/,
        exclude: /Test\.tsx?$/,
        use: {
          loader: 'awesome-typescript-loader',
          options: {
            useBabel: true,
            babelOptions: {
              plugins: ["glslify"]
            },
            useCache: true
          }
        }
      },
      {
        test: /Test\.tsx?$/,
        use: {
          loader: 'awesome-typescript-loader',
          options: {
            useBabel: true,
            babelOptions: {
              plugins: ["espower"]
            },
            useCache: true
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader?importLoaders=1!',
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => {
                return [
                  require('postcss-import'),
                  require('postcss-url'),
                  require('postcss-cssnext')({
                    features: {
                      customProperties: false,
                    },
                  }),
                ];
              }
            }
          },
        ],
      },
      {
        test: /\.(jpg|png|woff|woff2|eot|ttf|svg)/,
        use: [
          'url-loader?limit=10000',
        ],
      },
    ],
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    require("webpack-fail-plugin"),
  ],
  devtool: "inline-source-map",
  devServer: {
    contentBase: './dist',
    port: 23000,
    inline: true,
  },
}
