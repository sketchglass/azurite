import React = require("react")
import ReactDOM = require("react-dom")
import qs = require("querystring")
import {Vec2} from "paintvec"
import App from "./views/App"
import PictureParams from "./models/PictureParams"
import Picture from "./models/Picture"
import PictureSave from "./models/PictureSave"

const pictureParams: PictureParams = JSON.parse(qs.parse(location.search.slice(1)).params)

window.addEventListener("DOMContentLoaded", async () => {
  let picture: Picture
  if (pictureParams.action == "open") {
    picture = await PictureSave.openPath(pictureParams.filePath)
  } else {
    const {width, height, dpi} = pictureParams
    picture = new Picture(new Vec2(width, height), dpi)
  }
  ReactDOM.render(<App picture={picture}/>, document.getElementById("app"))
})
