import {Vec2} from "../../lib/Geometry"

export default
class Layer {
  canvas = document.createElement("canvas")
  context = this.canvas.getContext("2d")!

  constructor(public size: Vec2) {
    this.canvas.width = size.width
    this.canvas.height = size.height
  }
}
