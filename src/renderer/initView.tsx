import React = require("react")
import ReactDOM = require("react-dom")
import RootView from "./views/RootView"

ReactDOM.render(<RootView />, document.getElementById("app"))

if (module.hot) {
  module.hot.accept()
}
