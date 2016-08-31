import Layer from "./Layer"
import Waypoint from "./Waypoint"
import React = require("react")

abstract class Tool {
  layer: Layer
  abstract name: string
  abstract start(waypoint: Waypoint): void
  abstract move(waypoint: Waypoint): void
  abstract end(): void
  cursorMove(waypoint: Waypoint) {}
  renderSettings(): JSX.Element { return React.createElement("div") }
}
export default Tool
