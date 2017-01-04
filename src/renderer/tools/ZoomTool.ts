import {Vec2, Transform} from "paintvec"
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
  originalTranslation = new Vec2()
  startPos: Vec2

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    if (ev.button == 2) {
      this.picture.navigation.scale = 1
      return
    }
    const {scale, translation} = this.picture.navigation
    this.originalScale = scale
    this.originalTranslation = translation
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
    this.picture.navigation.translation = this.originalTranslation
      .transform(Transform.scale(new Vec2(scale / this.originalScale)))
  }

  end() {
  }
}
