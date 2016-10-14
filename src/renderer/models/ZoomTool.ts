import {Vec2} from "paintvec"
import Tool from './Tool'
import Waypoint from "./Waypoint"

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

  start(waypoint: Waypoint, rendererPos: Vec2) {
    const {navigation} = this.picture
    navigation.scale = nextScaleStep(navigation.scale)
  }

  move(waypoint: Waypoint, rendererPos: Vec2) {
  }

  end() {
  }
}


export
class ZoomOutTool extends Tool {
  name = "Zoom Out"
  cursor = "zoom-out"

  start(waypoint: Waypoint, rendererPos: Vec2) {
    const {navigation} = this.picture
    navigation.scale = prevScaleStep(navigation.scale)
  }

  move(waypoint: Waypoint, rendererPos: Vec2) {
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

  start(waypoint: Waypoint, rendererPos: Vec2) {
    const {scale} = this.picture.navigation
    this.originalScale = scale
    this.startPos = rendererPos
  }

  move(waypoint: Waypoint, rendererPos: Vec2) {
    const offset = rendererPos.sub(this.startPos)
    const distance = Math.pow(2, offset.x / 100)
    const scale = modScale(this.originalScale * distance)
    this.picture.navigation.scale = scale
  }

  end() {
  }
}
