import {Vec2} from 'paintvec'
import ShapeSelectTool from './ShapeSelectTool'
import {ToolPointerEvent} from './Tool'
import ToolIDs from './ToolIDs'

export default
class PolygonSelectTool extends ShapeSelectTool {
  commitDrawOnEnd = false
  readonly id = ToolIDs.polygonSelect
  readonly title = 'Polygon Select'
  get cursor() {
    return 'crosshair'
  }
  positions: Vec2[] = []

  start(ev: ToolPointerEvent) {
    const pos = ev.rendererPos.round()
    if (this.positions.length > 0) {
      this.positions.pop()
    }
    this.positions.push(pos, pos)
    super.start(ev)
  }

  hover(ev: ToolPointerEvent) {
    const pos = ev.rendererPos.round()
    if (this.positions.length > 0) {
      this.positions[this.positions.length - 1] = pos
    }
    this.update()
  }

  drawShape(context: CanvasRenderingContext2D) {
    for (let [i, pos] of this.positions.entries()) {
      if (i === 0) {
        context.moveTo(pos.x, pos.y)
      } else {
        context.lineTo(pos.x, pos.y)
      }
    }
  }

  keyDown(ev: React.KeyboardEvent<HTMLElement>) {
    super.keyDown(ev)
    if (ev.key === 'Enter') {
      this.commit()
      this.positions = []
    }
    if (ev.key === 'Escape') {
      this.positions = []
    }
  }
}
