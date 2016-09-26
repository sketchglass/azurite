import {Vec2, Vec4, Transform} from "../../lib/Geometry"
import Tool from './Tool'
import Waypoint from "./Waypoint"

export default
class TranslationTool extends Tool {
  name = "Translation"
  originalPos = new Vec2(0)
  originalTranslation = new Vec2(0)
  originalRendererToPicture = Transform.identity

  start(waypoint: Waypoint, rendererPos: Vec2) {
    this.originalRendererToPicture = this.renderer.transforms.rendererToPicture
    this.originalPos = this.originalRendererToPicture.transform(rendererPos)
    this.originalTranslation = this.picture.navigation.translation
  }

  move(waypoint: Waypoint, rendererPos: Vec2) {
    const pos = this.originalRendererToPicture.transform(rendererPos)
    const offset = pos.sub(this.originalPos)
    const translation = this.originalTranslation.add(offset)
    const {scale, rotation} = this.picture.navigation
    this.picture.navigation = {translation, scale, rotation}
    this.picture.changed.next()
  }

  end() {
  }
}
