import React = require("react")
import ReactDOM = require("react-dom")
import {webFrame} from "electron"
import App from "./views/App"
import {appState} from "./state/AppState"

webFrame.setVisualZoomLevelLimits(1, 1)
webFrame.setLayoutZoomLevelLimits(1, 1)

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<App />, document.getElementById("app"))
})


if (module.hot) {
  module.hot.accept()
  module.hot.dispose(async () => {
    if (await appState.prepareQuit()) {
      location.reload()
    }
  })
}
