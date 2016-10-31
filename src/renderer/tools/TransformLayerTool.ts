import {Vec2, Transform} from "paintvec"
import Tool from './Tool'
import Waypoint from "../models/Waypoint"

export default
class TransformLayerTool extends Tool {
  name = "Move"

  start(waypoint: Waypoint, rendererPos: Vec2) {
  }

  move(waypoint: Waypoint, rendererPos: Vec2) {
  }

  end() {
  }
}
