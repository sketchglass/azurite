import Layer from "./Layer"
import Waypoint from "./Waypoint"
import {Vec4} from "../../lib/Geometry"
import React = require("react")

abstract class Tool {
  layer: Layer
  abstract name: string
  abstract start(waypoint: Waypoint): Vec4
  abstract move(waypoint: Waypoint): Vec4
  abstract end(): Vec4
  cursorMove(waypoint: Waypoint) {}
  renderSettings(): JSX.Element { return React.createElement("div") }
}
export default Tool
