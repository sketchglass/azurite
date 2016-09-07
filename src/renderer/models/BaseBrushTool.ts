import {Vec2, Vec4, Transform, unionRect} from "../../lib/Geometry"
import Waypoint from "./Waypoint"
import Tool from "./Tool"
import {Framebuffer} from "../../lib/GL"
import {context} from "../GLContext"

abstract class BaseBrushTool extends Tool {
  private lastWaypoints: Waypoint[] = []
  private nextDabOffset = 0
  width = 10
  color = new Vec4(0, 0, 0, 1)
  opacity = 1
  minWidthRatio = 0.5
  spacingRatio = 0.1
  framebuffer = new Framebuffer(context)

  start(waypoint: Waypoint) {
    this.framebuffer.setTexture(this.layer.texture)

    this.lastWaypoints = [waypoint]
    this.nextDabOffset = this.brushSpacing(waypoint)
    this.renderWaypoints([waypoint])

    return this._rectForWaypoints([waypoint])
  }

  move(waypoint: Waypoint) {
    const {lastWaypoints} = this
    if (lastWaypoints.length == 4) {
      lastWaypoints.shift()
    }
    lastWaypoints.push(waypoint)

    if (lastWaypoints.length <= 2) {
      return new Vec4(0)
    }
    const getSpacing = this.brushSpacing.bind(this)
    const {waypoints, nextOffset} = (() => {
      if (lastWaypoints.length == 3) {
        return Waypoint.interpolateCurve(lastWaypoints[0], lastWaypoints[0], lastWaypoints[1], lastWaypoints[2], getSpacing, this.nextDabOffset)
      } else {
        return Waypoint.interpolateCurve(lastWaypoints[0], lastWaypoints[1], lastWaypoints[2], lastWaypoints[3], getSpacing, this.nextDabOffset)
      }
    })()

    this.nextDabOffset = nextOffset

    if (waypoints.length == 0) {
      return new Vec4(0)
    } else {
      this.renderWaypoints(waypoints)
      return this._rectForWaypoints(waypoints)
    }
  }

  end() {
    const getSpacing = this.brushSpacing.bind(this)
    const {lastWaypoints} = this
    if (lastWaypoints.length < 2) {
      return
    }
    const {waypoints} = (() => {
      if (lastWaypoints.length == 2) {
        return Waypoint.interpolate(lastWaypoints[0], lastWaypoints[1], getSpacing, this.nextDabOffset)
      } else if (lastWaypoints.length == 3) {
        return Waypoint.interpolateCurve(lastWaypoints[0], lastWaypoints[1], lastWaypoints[2], lastWaypoints[2], getSpacing, this.nextDabOffset)
      } else {
        return Waypoint.interpolateCurve(lastWaypoints[1], lastWaypoints[2], lastWaypoints[3], lastWaypoints[3], getSpacing, this.nextDabOffset)
      }
    })()

    if (waypoints.length == 0) {
      return new Vec4(0)
    } else {
      this.renderWaypoints(waypoints)
      return this._rectForWaypoints(waypoints)
    }
  }

  brushSize(waypoint: Waypoint) {
    return this.width * (this.minWidthRatio + (1 - this.minWidthRatio) * waypoint.pressure)
  }
  brushSpacing(waypoint: Waypoint) {
    return this.brushSize(waypoint) * this.spacingRatio
  }

  private _rectForWaypoints(waypoints: Waypoint[]) {
    const rectWidth = this.width + 2
    const rects = waypoints.map(w => new Vec4(w.pos.x - rectWidth * 0.5, w.pos.y - rectWidth * 0.5, rectWidth, rectWidth))
    return unionRect(...rects)
  }

  abstract renderWaypoints(waypoints: Waypoint[]): void
}

export default BaseBrushTool
