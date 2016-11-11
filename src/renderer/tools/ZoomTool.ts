import {Vec2} from "paintvec"
import Tool, {ToolPointerEvent} from './Tool'
import Waypoint from "../models/Waypoint"

const SCALE_STEPS = [
  0.25,
  0.33,
  0.5,
  0.67,
  1,
  1.5,
  2,
  4,
  8,
  16,
  32
]

function nextScaleStep(scale: number) {
  for (const step of SCALE_STEPS) {
    if (scale < step) {
      return step
    }
  }
  return scale
}

function prevScaleStep(scale: number) {
  for (const step of Array.from(SCALE_STEPS).reverse()) {
    if (step < scale) {
      return step
    }
  }
  return scale
}

export
class ZoomInTool extends Tool {
  name = "Zoom In"
  cursor = "zoom-in"

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    const {navigation} = this.picture
    navigation.scale = nextScaleStep(navigation.scale)
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
    const {navigation} = this.picture
    navigation.scale = prevScaleStep(navigation.scale)
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
