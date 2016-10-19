import {observable} from "mobx"
import Picture from "../models/Picture"
import Renderer from "../views/Renderer"
import Waypoint from "../models/Waypoint"
import {Vec2} from "paintvec"
import React = require("react")

abstract class Tool {
  picture: Picture
  renderer: Renderer
  abstract name: string
  @observable cursor = "auto"
  @observable cursorElement: HTMLElement|undefined
  @observable cursorElementSize = 0
  abstract start(waypoint: Waypoint, rendererPos: Vec2): void
  abstract move(waypoint: Waypoint, rendererPos: Vec2): void
  abstract end(): void
  cursorMove(waypoint: Waypoint) {}
  renderSettings(): JSX.Element { return React.createElement("div") }
}
export default Tool
