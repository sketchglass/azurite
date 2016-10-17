import React = require("react")
import ReactDOM = require("react-dom")
import qs = require("querystring")
import App from "./views/App"
import PictureParams from "./models/PictureParams"

const pictureParams: PictureParams = JSON.parse(qs.parse(location.search.slice(1)).params)

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<App pictureParams={pictureParams}/>, document.getElementById("app"))
})
