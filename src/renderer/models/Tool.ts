import Picture from "./Picture"
import Waypoint from "./Waypoint"
import {Vec4} from "../../lib/Geometry"
import React = require("react")

abstract class Tool {
  picture: Picture
  abstract name: string
  abstract start(waypoint: Waypoint): Vec4
  abstract move(waypoint: Waypoint): Vec4
  abstract end(): Vec4
  cursorMove(waypoint: Waypoint) {}
  renderSettings(): JSX.Element { return React.createElement("div") }
}
export default Tool
