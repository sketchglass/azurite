import {Vec2} from 'paintvec'
import KeyInput from '../../lib/KeyInput'
import {renderer} from '../views/Renderer'
import Tool, {ToolPointerEvent} from './Tool'
import ToolIDs from './ToolIDs'

export default
class RotateTool extends Tool {
  readonly id = ToolIDs.rotate
  readonly title = 'Rotate'
  get cursor() {
    return 'ew-resize' // TODO: use more rotate-like cursor
  }
  private dragging = false
  private originalAngle = 0
  private originalRotation = 0

  tempShortcut = new KeyInput(['Shift'], 'Space')

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    if (ev.button === 2) {
      this.picture.navigation.resetRotation()
      return
    }
    this.originalAngle = this.posAngle(ev.rendererPos)
    this.originalRotation = this.picture.navigation.rotation
    this.picture.navigation.saveRendererCenter()
    this.dragging = true
  }

  move(ev: ToolPointerEvent) {
    if (!this.picture || !this.dragging) {
      return
    }
    const angle = this.posAngle(ev.rendererPos)
    const diff = angle - this.originalAngle
    const rotation = diff + this.originalRotation
    this.picture.navigation.rotateAroundRendererCenter(rotation)
  }

  posAngle(rendererPos: Vec2) {
    if (!this.picture) {
      return 0
    }
    const offset = rendererPos.sub(renderer.size.mulScalar(0.5).round())
    return this.picture.navigation.horizontalFlip ? new Vec2(-offset.x, offset.y).angle() : offset.angle()
  }

  end() {
    this.dragging = false
  }
}
