import {observable, action, computed} from 'mobx'
import {Vec2, Transform} from 'paintvec'

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

function normalizeRotation(rotation: number) {
  while (Math.PI < rotation) {
    rotation -= 2 * Math.PI
  }
  while (rotation < -Math.PI) {
    rotation += 2 * Math.PI
  }
  return rotation
}

export
class Navigation {
  @observable translation = new Vec2()
  @observable scale = 1
  @observable rotation = 0
  @observable horizontalFlip = false
  private originalTranslation = new Vec2()
  private originalScale = 1
  private originalRotation = 0

  @computed get transform() {
    let transform = Transform.scale(new Vec2(this.scale)).rotate(this.rotation).translate(this.translation.round())
    if (this.horizontalFlip) {
      transform = transform.scale(new Vec2(-1, 1))
    }
    return transform
  }
  @computed get invertedTransform() {
    return this.transform.invert() || new Transform()
  }

  saveRendererCenter() {
    this.originalTranslation = this.translation
    this.originalScale = this.scale
    this.originalRotation = this.rotation
  }

  @action scaleAroundRendererCenter(scale: number) {
    this.scale = scale
    this.translation = this.originalTranslation.mulScalar(scale / this.originalScale).round()
  }

  @action rotateAroundRendererCenter(rotation: number) {
    rotation = normalizeRotation(rotation)
    this.rotation = rotation
    this.translation = this.originalTranslation.transform(Transform.rotate(rotation - this.originalRotation)).round()
  }

  @action zoomIn() {
    this.saveRendererCenter()
    this.scaleAroundRendererCenter(nextScaleStep(this.scale))
  }
  @action zoomOut() {
    this.saveRendererCenter()
    this.scaleAroundRendererCenter(prevScaleStep(this.scale))
  }
  @action rotateLeft() {
    this.saveRendererCenter()
    const step = Math.round(this.rotation * (180 / Math.PI) / ROTATION_STEP_DEG)
    this.rotateAroundRendererCenter((step - 1) * ROTATION_STEP_DEG * (Math.PI / 180))
  }
  @action rotateRight() {
    this.saveRendererCenter()
    const step = Math.round(this.rotation * (180 / Math.PI) / ROTATION_STEP_DEG)
    this.rotateAroundRendererCenter((step + 1) * ROTATION_STEP_DEG * (Math.PI / 180))
  }

  @action resetScale() {
    this.saveRendererCenter()
    this.scaleAroundRendererCenter(1)
  }
  @action resetRotation() {
    this.saveRendererCenter()
    this.rotateAroundRendererCenter(0)
  }
}
