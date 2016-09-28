import {Vec2, Vec4, Transform} from "../../lib/Geometry"
import Tool from './Tool'
import Waypoint from "./Waypoint"

function modRotation(rotation: number) {
  while (Math.PI < rotation) {
    rotation -= 2 * Math.PI
  }
  while (rotation < -Math.PI) {
    rotation += 2 * Math.PI
  }
  return rotation
}

export default
class RotateTool extends Tool {
  name = "Rotate"
  cursor = "ew-resize" // TODO: use more rotate-like cursor
  originalAngle = 0
  originalRotation = 0

  start(waypoint: Waypoint, rendererPos: Vec2) {
    const offset = rendererPos.sub(this.renderer.size.mul(0.5).round())
    this.originalAngle = offset.atan2()
    this.originalRotation = this.picture.navigation.rotation
  }

  move(waypoint: Waypoint, rendererPos: Vec2) {
    const offset = rendererPos.sub(this.renderer.size.mul(0.5).round())
    const angle = offset.atan2()
    const {translation, scale} = this.picture.navigation
    const rotation = modRotation(angle - this.originalAngle + this.originalRotation)
    this.picture.navigation = {translation, scale, rotation}
    this.picture.changed.next()
  }

  end() {
  }
}
