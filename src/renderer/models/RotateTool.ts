import {Vec2} from "paintvec"
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
    const offset = rendererPos.sub(this.renderer.size.mulScalar(0.5).round())
    this.originalAngle = offset.angle()
    this.originalRotation = this.picture.navigation.rotation
  }

  move(waypoint: Waypoint, rendererPos: Vec2) {
    const offset = rendererPos.sub(this.renderer.size.mulScalar(0.5).round())
    const angle = offset.angle()
    const {translation, scale} = this.picture.navigation
    const rotation = modRotation(angle - this.originalAngle + this.originalRotation)
    this.picture.navigation.rotation = rotation
  }

  end() {
  }
}
