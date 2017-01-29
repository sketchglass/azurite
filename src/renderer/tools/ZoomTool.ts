import {Vec2} from "paintvec"
import Tool, {ToolPointerEvent} from './Tool'
import ToolIDs from "./ToolIDs"
import KeyInput from "../../lib/KeyInput"

const modScale = (scale: number) => {
  return (scale < 0.25) ? 0.25 : (scale > 32) ? 32 : scale
}

export
class ZoomTool extends Tool {
  readonly id = ToolIDs.zoom
  readonly title = "Zoom"
  get cursor() {
    return "zoom-in"
  }
  private originalScale = 1.0
  private dragging = false
  private startPos = new Vec2()
  tempShortcut = new KeyInput(["MetaOrControl"], " ")

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    if (ev.button == 2) {
      this.picture.navigation.resetScale()
      return
    }
    const {scale} = this.picture.navigation
    this.originalScale = scale
    this.picture.navigation.saveRendererCenter()
    this.startPos = ev.rendererPos
    this.dragging = true
  }

  move(ev: ToolPointerEvent) {
    if (!this.picture || !this.dragging) {
      return
    }
    const offset = ev.rendererPos.sub(this.startPos)
    const distance = Math.pow(2, offset.x / 100)
    const scale = modScale(this.originalScale * distance)
    this.picture.navigation.scaleAroundRendererCenter(scale)
  }

  end() {
    this.dragging = false
  }
}
