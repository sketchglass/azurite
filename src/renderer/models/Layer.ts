import {Size} from "./Geometry"

export default
class Layer {
  canvas = document.createElement("canvas")
  context = this.canvas.getContext("2d")!

  constructor(public size: Size) {
    this.canvas.width = size.width
    this.canvas.height = size.height
  }
}
