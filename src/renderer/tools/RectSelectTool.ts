import {Vec2, Rect} from 'paintvec'
import ShapeSelectTool from './ShapeSelectTool'
import {ToolPointerEvent} from './Tool'
import ToolIDs from './ToolIDs'

type RectSelectType = 'rect'|'ellipse'

export default
class RectSelectTool extends ShapeSelectTool {
  readonly id = this.type === 'rect' ? ToolIDs.rectSelect : ToolIDs.ellipseSelect
  readonly title = this.type === 'rect' ? 'Rectangle Select' : 'Ellipse Select'
  get cursor() {
    return 'crosshair'
  }
  startPos = new Vec2()
  currentPos = new Vec2()

  get selectingRect() {
    if (this.drawing && !this.startPos.equals(this.currentPos)) {
      return Rect.fromTwoPoints(this.startPos, this.currentPos)
    }
  }

  constructor(public type: RectSelectType) {
    super()
  }

  start(ev: ToolPointerEvent) {
    this.startPos = this.currentPos = ev.rendererPos.round()
    super.start(ev)
  }

  move(ev: ToolPointerEvent) {
    this.currentPos = ev.rendererPos.round()
    super.move(ev)
  }

  drawShape(context: CanvasRenderingContext2D) {
    const rect = this.selectingRect
    if (rect) {
      if (this.type === 'rect') {
        context.rect(rect.left, rect.top, rect.width, rect.height)
      } else {
        const {center, width, height} = rect
        context.ellipse(center.x, center.y, width / 2, height / 2, 0, 0, 2 * Math.PI)
      }
    }
  }
}
