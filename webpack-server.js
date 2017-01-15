const app = require("express")();
var webpack = require('webpack');
var webpackConfig = require('./webpack.config');
var compiler = webpack(webpackConfig);

app.use(require("webpack-dev-middleware")(compiler, {
    noInfo: true, publicPath: webpackConfig.output.publicPath, contentBase: webpackConfig.devServer.contentBase
}));
app.use(require("webpack-hot-middleware")(compiler));
app.listen(webpackConfig.devServer.port);
