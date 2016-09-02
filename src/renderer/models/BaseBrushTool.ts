import {Vec2, Vec4, Transform, unionRect} from "../../lib/Geometry"
import Waypoint from "./Waypoint"
import Tool from "./Tool"
import {Framebuffer} from "../../lib/GL"
import {context} from "../GLContext"

abstract class BaseBrushTool extends Tool {
  private lastWaypoint: Waypoint|undefined
  private nextDabOffset = 0
  width = 10
  color = new Vec4(0, 0, 0, 1)
  opacity = 1
  minWidthRatio = 0.5
  spacingRatio = 0.1
  framebuffer = new Framebuffer(context)

  start(waypoint: Waypoint) {
    this.lastWaypoint = waypoint
    this.nextDabOffset = 0

    this.framebuffer.setTexture(this.layer.texture)

    return new Vec4(0)
  }

  move(waypoint: Waypoint) {
    if (!this.lastWaypoint) {
      return new Vec4(0)
    }

    const getNextSpacing = (waypoint: Waypoint) => {
      const brushSize = this.width * (this.minWidthRatio + (1 - this.minWidthRatio) * waypoint.pressure)
      return brushSize * this.spacingRatio
    }
    const {waypoints, nextOffset} = Waypoint.interpolate(this.lastWaypoint, waypoint, getNextSpacing, this.nextDabOffset)
    this.lastWaypoint = waypoint
    this.nextDabOffset = nextOffset

    if (waypoints.length == 0) {
      return new Vec4(0)
    } else {
      return this.renderWaypoints(waypoints)
    }
  }

  end() {
    return new Vec4(0)
  }

  abstract renderWaypoints(waypoints: Waypoint[]): Vec4
}

export default BaseBrushTool
