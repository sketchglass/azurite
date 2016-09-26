import Picture from "./Picture"
import Renderer from "../views/Renderer"
import Waypoint from "./Waypoint"
import {Vec4} from "../../lib/Geometry"
import React = require("react")

abstract class Tool {
  picture: Picture
  renderer: Renderer
  abstract name: string
  abstract start(waypoint: Waypoint): void
  abstract move(waypoint: Waypoint): void
  abstract end(): void
  cursorMove(waypoint: Waypoint) {}
  renderSettings(): JSX.Element { return React.createElement("div") }
}
export default Tool
