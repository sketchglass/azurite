import React = require("react")
import ReactDOM = require("react-dom")
import {webFrame, remote} from "electron"
import App from "./views/App"

webFrame.setVisualZoomLevelLimits(1, 1)
webFrame.setLayoutZoomLevelLimits(1, 1)

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<App />, document.getElementById("app"))
  remote.getCurrentWindow().show()
})
