import {Vec2} from "../../lib/Geometry"
import {Color} from "../../lib/Color"
import Waypoint from "./Waypoint"
import Tool from "./Tool"

export default
class BrushTool extends Tool {
  private lastWaypoint: Waypoint|undefined
  private nextDabOffset = 0
  width = 10
  color = Color.rgb(0, 0, 0)

  start(waypoint: Waypoint) {
    this.lastWaypoint = waypoint
    this.nextDabOffset = 0
  }

  move(waypoint: Waypoint) {
    if (this.lastWaypoint) {
      const {waypoints, nextOffset} = Waypoint.interpolate(this.lastWaypoint, waypoint, this.nextDabOffset)
      this.lastWaypoint = waypoint
      this.nextDabOffset = nextOffset
      for (const p of waypoints) {
        this.drawDab(p)
      }
    }
  }

  end() {
  }

  drawDab(waypoint: Waypoint) {
    const {context} = this.layer
    const {pos, pressure} = waypoint
    context.fillStyle = this.color.toRgbaString()
    context.beginPath()
    context.arc(pos.x, pos.y, this.width * 0.5 * pressure, 0, 2 * Math.PI)
    context.fill()
  }
}
