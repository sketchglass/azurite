import {Vec2, Transform} from "paintvec"
import Tool, {ToolPointerEvent} from './Tool'
import {renderer} from "../views/Renderer"
import ToolIDs from "./ToolIDs"

export default
class RotateTool extends Tool {
  readonly id = ToolIDs.rotate
  readonly title = "Rotate"
  get cursor() {
    return "ew-resize" // TODO: use more rotate-like cursor
  }
  originalAngle = 0
  originalRotation = 0
  originalTranslation = new Vec2()

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
    this.originalTranslation = this.picture.navigation.translation
  }

  move(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    if (ev.button == 2) {
      return
    }
    const angle = this.posAngle(ev.rendererPos)
    const diff = angle - this.originalAngle
    const rotation = diff + this.originalRotation
    this.picture.navigation.setNormalizedRotation(rotation)
    this.picture.navigation.translation = this.originalTranslation.transform(Transform.rotate(diff))
  }

  posAngle(rendererPos: Vec2) {
    if (!this.picture) {
      return 0
    }
    const offset = rendererPos.sub(renderer.size.mulScalar(0.5).round())
    return this.picture.navigation.horizontalFlip ? new Vec2(-offset.x, offset.y).angle() : offset.angle()
  }

  end() {
  }
}
