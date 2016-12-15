import {Vec2, Rect} from "paintvec"
import ShapeSelectTool from "./ShapeSelectTool"
import {ToolPointerEvent} from "./Tool"

export default
class RectSelectTool extends ShapeSelectTool {
  name = "Rectangle Select"
  get cursor() {
    return "crosshair"
  }
  startPos = new Vec2()
  currentPos = new Vec2()

  start(ev: ToolPointerEvent) {
    this.startPos = this.currentPos = ev.rendererPos.round()
    super.start(ev)
  }
  move(ev: ToolPointerEvent) {
    this.currentPos = ev.rendererPos.round()
    super.move(ev)
  }

  get selectingRect() {
    if (this.drawing && !this.startPos.equals(this.currentPos)) {
      return Rect.fromTwoPoints(this.startPos, this.currentPos)
    }
  }

  drawShape(context: CanvasRenderingContext2D) {
    const rect = this.selectingRect
    if (rect) {
      context.rect(rect.left, rect.top, rect.width, rect.height)
    }
  }
}
