import React = require("react")
import ReactDOM = require("react-dom")
import DrawArea from "./DrawArea"

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<DrawArea />, document.getElementById("app"))
})
