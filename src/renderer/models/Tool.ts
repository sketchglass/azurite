import Layer from "./Layer"
import Waypoint from "./Waypoint"

export default
class Tool {
  layer: Layer
  start(waypoint: Waypoint) {}
  move(waypoint: Waypoint) {}
  end() {}
  cursorMove(waypoint: Waypoint) {}
}
