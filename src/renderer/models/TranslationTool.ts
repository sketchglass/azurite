import {Vec2, Vec4} from "../../lib/Geometry"
import Tool from './Tool'
import Waypoint from "./Waypoint"

export default
class TranslationTool extends Tool {
  name = "Translation"
  startPos = new Vec2(0)
  startTranslation = new Vec2(0)

  start(waypoint: Waypoint) {
    this.startPos = waypoint.pos
    this.startTranslation = this.picture.navigation.translation
    return new Vec4(0)
  }

  move(waypoint: Waypoint) {
    const offset = waypoint.pos.sub(this.startPos)
    const translation = this.startTranslation.add(offset)
    const {scale, rotation} = this.picture.navigation
    this.picture.navigation = {translation, scale, rotation}
    this.picture.changed.next()
    return new Vec4(0)
  }

  end() {
    return new Vec4(0)
  }
}
