import {Vec2, Transform} from "paintvec"
import Tool, {ToolPointerEvent} from './Tool'

export default
class RectSelectTool extends Tool {
  name = "Rectangle Select"
  get cursor() {
    return "crosshair"
  }

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
  }

  move(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
  }

  end() {
  }
}
