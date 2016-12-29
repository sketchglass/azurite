import {Vec2} from "paintvec"
import ShapeSelectTool from "./ShapeSelectTool"
import {ToolPointerEvent} from "./Tool"
import ToolIDs from "./ToolIDs"

export default
class FreehandSelectTool extends ShapeSelectTool {
  readonly id = ToolIDs.freehandSelect
  readonly title = "Freehand Select"
  get cursor() {
    return "crosshair"
  }
  positions: Vec2[] = []

  start(ev: ToolPointerEvent) {
    this.positions = [ev.rendererPos.round()]
    super.start(ev)
  }

  move(ev: ToolPointerEvent) {
    this.positions.push(ev.rendererPos.round())
    super.move(ev)
  }

  drawShape(context: CanvasRenderingContext2D) {
    for (let [i, pos] of this.positions.entries()) {
      if (i == 0) {
        context.moveTo(pos.x, pos.y)
      } else {
        context.lineTo(pos.x, pos.y)
      }
    }
  }
}
