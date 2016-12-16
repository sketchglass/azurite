import {Vec2, Transform} from "paintvec"
import Tool, {ToolPointerEvent} from './Tool'
import {renderer} from "../views/Renderer"

export default
class PanTool extends Tool {
  name = "Pan"
  get cursor() {
    return "all-scroll"
  }
  originalPos = new Vec2(0)
  originalTranslation = new Vec2(0)
  originalRendererToPicture = new Transform()

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    this.originalRendererToPicture = renderer.transformToPicture
    this.originalPos = ev.rendererPos.transform(this.originalRendererToPicture)
    this.originalTranslation = this.picture.navigation.translation
  }

  move(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    const pos = ev.rendererPos.transform(this.originalRendererToPicture)
    const offset = pos.sub(this.originalPos)
    const translation = this.originalTranslation.add(offset).floor()
    this.picture.navigation.translation = translation
  }

  end() {
  }
}
