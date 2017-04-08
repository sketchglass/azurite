import {Vec2} from 'paintvec'
import Tool, {ToolPointerEvent} from './Tool'
import ToolIDs from './ToolIDs'
import KeyInput from '../../lib/KeyInput'

export default
class PanTool extends Tool {
  readonly id = ToolIDs.pan
  readonly title = 'Pan'
  get cursor() {
    return 'all-scroll'
  }
  originalPos = new Vec2(0)
  originalTranslation = new Vec2(0)
  tempShortcut = new KeyInput([], 'Space')

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    this.originalPos = ev.rendererPos.round()
    this.originalTranslation = this.picture.navigation.translation
  }

  move(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    const pos = ev.rendererPos.round()
    const offset = pos.sub(this.originalPos)
    const translation = this.originalTranslation.add(offset)
    this.picture.navigation.translation = translation
  }

  end() {
  }
}
