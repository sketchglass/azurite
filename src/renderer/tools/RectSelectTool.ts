import {Rect} from "paintvec"
import ShapeSelectTool from "./ShapeSelectTool"

export default
class RectSelectTool extends ShapeSelectTool {
  name = "Rectangle Select"
  get cursor() {
    return "crosshair"
  }

  get selectingRect() {
    if (this.drawing && !this.startRendererPos.equals(this.currentRendererPos)) {
      return Rect.fromTwoPoints(this.startRendererPos, this.currentRendererPos)
    }
  }

  drawShape(context: CanvasRenderingContext2D) {
    const rect = this.selectingRect
    if (rect) {
      context.rect(rect.left, rect.top, rect.width, rect.height)
    }
  }
}
