import {Vec2} from "paintvec"
import Tool, {ToolPointerEvent} from './Tool'
import ToolIDs from "./ToolIDs"

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
  originalScale = 1.0
  startPos: Vec2

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    if (ev.button == 2) {
      this.picture.navigation.scale = 1
      return
    }
    const {scale} = this.picture.navigation
    this.originalScale = scale
    this.startPos = ev.rendererPos
  }

  move(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    if (ev.button == 2) {
      return
    }
    const offset = ev.rendererPos.sub(this.startPos)
    const distance = Math.pow(2, offset.x / 100)
    const scale = modScale(this.originalScale * distance)
    this.picture.navigation.scale = scale
  }

  end() {
  }
}
