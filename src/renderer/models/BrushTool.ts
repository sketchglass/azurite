import {Point} from "../../lib/Geometry"
import Pointer from "./Pointer"
import Tool from "./Tool"

export default
class BrushTool extends Tool {
  private lastPointer: Pointer|undefined
  private nextDabOffset = 0
  radius = 10
  color = "rgba(0,0,0,0.5)"

  start(pointer: Pointer) {
    this.lastPointer = pointer
    this.nextDabOffset = 0
  }

  move(pointer: Pointer) {
    if (this.lastPointer) {
      const {pointers, nextOffset} = Pointer.interpolate(this.lastPointer, pointer, this.nextDabOffset)
      this.lastPointer = pointer
      this.nextDabOffset = nextOffset
      for (const p of pointers) {
        this.drawDab(p)
      }
    }
  }

  end() {
  }

  drawDab(pointer: Pointer) {
    const {context} = this.layer
    const {pos, pressure} = pointer
    context.fillStyle = this.color
    context.beginPath()
    context.arc(pos.x, pos.y, 10 * pressure, 0, 2 * Math.PI)
    context.fill()
  }
}
