import React = require("react")
import ReactDOM = require("react-dom")
import qs = require("querystring")
import App from "./views/App"
import {AppState} from "./models/AppState"
import PictureParams from "./models/PictureParams"
import Picture from "./models/Picture"

const pictureParams: PictureParams = JSON.parse(qs.parse(location.search.slice(1)).params)

window.addEventListener("DOMContentLoaded", () => {
  const picture = new Picture(pictureParams)
  AppState.instance.pictures.push(picture)
  ReactDOM.render(<App />, document.getElementById("app"))
})
