import {Vec2} from "paintvec"
import Tool, {ToolPointerEvent} from './Tool'
import Waypoint from "../models/Waypoint"

export
class ZoomInTool extends Tool {
  name = "Zoom In"
  cursor = "zoom-in"

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    this.picture.navigation.zoomIn()
  }

  move(ev: ToolPointerEvent) {
  }

  end() {
  }
}

export
class ZoomOutTool extends Tool {
  name = "Zoom Out"
  cursor = "zoom-out"

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    this.picture.navigation.zoomOut()
  }

  move(ev: ToolPointerEvent) {
  }

  end() {
  }
}

const modScale = (scale: number) => {
  return (scale < 0.25) ? 0.25 : (scale > 32) ? 32 : scale
}

export
class ZoomTool extends Tool {
  name = "Zoom"
  cursor = "zoom-in"
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
