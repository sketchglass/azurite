import * as React from "react"
import {observable} from "mobx"
import {Vec2, Transform, Rect} from "paintvec"
import Tool, {ToolPointerEvent} from './Tool'
import FrameDebounced from "../views/components/FrameDebounced"

class RectSelectOverlay extends FrameDebounced<{tool: RectSelectTool}, {}> {
  renderDebounced() {
    const {tool} = this.props
    const {rect} = tool
    if (!rect) {
      return <g />
    }
    const vertices = new Rect(rect.topLeft.divScalar(devicePixelRatio), rect.bottomRight.divScalar(devicePixelRatio)).vertices()
    return (
      <polygon points={vertices.map(({x, y}) => `${x},${y}`).join(" ")} stroke="#888" fill="transparent" />
    )
  }
}

// TODO: move to paintvec
function rectFromPoints(p0: Vec2, p1: Vec2) {
  const trueLeft = Math.min(p0.x, p1.x)
  const trueRight = Math.max(p0.x, p1.x)
  const trueTop = Math.min(p0.y, p1.y)
  const trueBottom = Math.max(p0.y, p1.y)
  return new Rect(new Vec2(trueLeft, trueTop), new Vec2(trueRight, trueBottom))
}

export default
class RectSelectTool extends Tool {
  name = "Rectangle Select"
  get cursor() {
    return "crosshair"
  }

  selecting = false
  startPos = new Vec2()
  @observable rect: Rect|undefined

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    const {selection} = this.picture
    const {context, size} = selection
    if (!ev.shiftKey) {
      selection.clear()
    }
    this.startPos = ev.rendererPos
    this.selecting = true
  }

  move(ev: ToolPointerEvent) {
    if (!this.picture || !this.selecting) {
      return
    }
    this.rect = rectFromPoints(this.startPos, ev.rendererPos)
  }

  end(ev: ToolPointerEvent) {
    if (!this.picture || !this.selecting) {
      return
    }
    this.selecting = false
    this.rect = undefined
  }
  
  renderOverlayUI() {
    return <RectSelectOverlay tool={this} />
  }
}
