import * as React from "react"
import {observable} from "mobx"
import {Vec2, Transform, Rect} from "paintvec"
import {Texture, TextureDrawTarget, BlendMode, Color} from "paintgl"
import {context} from "../GLContext"
import {drawTexture} from "../GLUtil"
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

  adding = false

  canvas = document.createElement("canvas")
  context = this.canvas.getContext("2d")!
  canvasTexture = new Texture(context, {})
  originalSelectionTexture = new Texture(context, {})
  originalSelectionDrawTarget = new TextureDrawTarget(context, this.originalSelectionTexture)

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }

    const {selection} = this.picture

    if (!new Vec2(this.canvas.width, this.canvas.height).equals(selection.size)) {
      this.canvas.width = selection.size.width
      this.canvas.height = selection.size.height
    }
    if (!this.originalSelectionTexture.size.equals(selection.size)) {
      this.originalSelectionTexture.size = selection.size
    }

    drawTexture(this.originalSelectionDrawTarget, selection.texture, {blendMode: "src"})

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)


    this.adding = ev.shiftKey
    this.startPos = ev.rendererPos
    this.selecting = true
  }

  move(ev: ToolPointerEvent) {
    if (!this.picture || !this.selecting) {
      return
    }
    this.rect = rectFromPoints(this.startPos, ev.rendererPos)

    this.context.setTransform(1, 0, 0, 1, 0, 0)
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const transform = this.renderer.transformToPicture
    this.context.setTransform(transform.m00, transform.m01, transform.m10, transform.m11, transform.m20, transform.m21)
    this.context.fillStyle = "white"
    this.context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height)

    this.canvasTexture.setImage(this.canvas)

    const {selection} = this.picture

    if (this.adding) {
      drawTexture(selection.drawTarget, this.originalSelectionTexture, {blendMode: "src"})
      drawTexture(selection.drawTarget, this.canvasTexture, {blendMode: "src-over"})
    } else {
      drawTexture(selection.drawTarget, this.canvasTexture, {blendMode: "src"})
    }
    this.renderer.wholeDirty = true
    this.renderer.update()
  }

  end(ev: ToolPointerEvent) {
    if (!this.picture || !this.selecting) {
      return
    }
    this.selecting = false
    this.rect = undefined
  }

  // renderOverlayUI() {
  //   return <RectSelectOverlay tool={this} />
  // }
}
