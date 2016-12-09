import {Vec2} from "paintvec"
import {observable, action} from "mobx"

const SCALE_STEPS = [
  0.125,
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

const ROTATION_STEP_DEG = 15

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
class Navigation {
  @observable translation = new Vec2(0)
  @observable scale = 1
  @observable rotation = 0
  @observable horizontalFlip = false

  @action zoomIn() {
    this.scale = nextScaleStep(this.scale)
  }
  @action zoomOut() {
    this.scale = prevScaleStep(this.scale)
  }
  @action rotateLeft() {
    const step = Math.round(this.rotation * (180 / Math.PI) / ROTATION_STEP_DEG)
    this.setNormalizedRotation((step - 1) * ROTATION_STEP_DEG * (Math.PI / 180))
  }
  @action rotateRight() {
    const step = Math.round(this.rotation * (180 / Math.PI) / ROTATION_STEP_DEG)
    this.setNormalizedRotation((step + 1) * ROTATION_STEP_DEG * (Math.PI / 180))
  }
  @action setNormalizedRotation(rotation: number) {
    while (Math.PI < rotation) {
      rotation -= 2 * Math.PI
    }
    while (rotation < -Math.PI) {
      rotation += 2 * Math.PI
    }
    this.rotation = rotation
  }
}
