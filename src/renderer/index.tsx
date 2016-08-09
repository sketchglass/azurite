import React = require("react")
import ReactDOM = require("react-dom")
import DrawArea from "./views/DrawArea"

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<DrawArea />, document.getElementById("app"))
})
