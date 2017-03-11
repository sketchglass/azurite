import React = require("react")
import ReactDOM = require("react-dom")
import {webFrame} from "electron"
import RootView from "./views/RootView"
import {appState} from "./app/AppState"

webFrame.setVisualZoomLevelLimits(1, 1)
webFrame.setLayoutZoomLevelLimits(1, 1)

appState.bootstrap()

function render() {
  ReactDOM.render(<RootView />, document.getElementById("app"))
}

window.addEventListener("DOMContentLoaded", () => {
  render()
})

if (module.hot) {
  module.hot.accept("./views/RootView", () => {
    render()
  })
  module.hot.accept()
  module.hot.dispose(() => {
    appState.reload()
  })
}
