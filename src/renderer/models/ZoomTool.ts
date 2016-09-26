import {Vec2} from "../../lib/Geometry"
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

  start(waypoint: Waypoint, rendererPos: Vec2) {
    let {translation, rotation, scale} = this.picture.navigation
    scale = nextScaleStep(scale)
    this.picture.navigation = {translation, scale, rotation}
    this.picture.changed.next()
  }

  move(waypoint: Waypoint, rendererPos: Vec2) {
  }

  end() {
  }
}


export
class ZoomOutTool extends Tool {
  name = "Zoom Out"

  start(waypoint: Waypoint, rendererPos: Vec2) {
    let {translation, rotation, scale} = this.picture.navigation
    scale = prevScaleStep(scale)
    this.picture.navigation = {translation, scale, rotation}
    this.picture.changed.next()
  }

  move(waypoint: Waypoint, rendererPos: Vec2) {
  }

  end() {
  }
}
