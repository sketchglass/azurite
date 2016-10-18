import React = require("react")
import ReactDOM = require("react-dom")
import App from "./views/App"

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<App />, document.getElementById("app"))
})
