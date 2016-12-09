import {Vec2} from "paintvec"
import Tool, {ToolPointerEvent} from './Tool'
import Waypoint from "../models/Waypoint"

export default
class RotateTool extends Tool {
  name = "Rotate"
  get cursor() {
    return "ew-resize" // TODO: use more rotate-like cursor
  }
  originalAngle = 0
  originalRotation = 0

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    if (ev.button == 2) {
      this.picture.navigation.rotation = 0
      return
    }
    this.originalAngle = this.posAngle(ev.rendererPos)
    this.originalRotation = this.picture.navigation.rotation
  }

  move(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    if (ev.button == 2) {
      return
    }
    const {translation, scale} = this.picture.navigation
    const angle = this.posAngle(ev.rendererPos)
    const rotation = angle - this.originalAngle + this.originalRotation
    this.picture.navigation.setNormalizedRotation(rotation)
  }

  posAngle(rendererPos: Vec2) {
    if (!this.picture) {
      return 0
    }
    const offset = rendererPos.sub(this.renderer.size.mulScalar(0.5).round())
    return this.picture.navigation.horizontalFlip ? new Vec2(-offset.x, offset.y).angle() : offset.angle()
  }

  end() {
  }
}
