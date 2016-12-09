import {observable} from "mobx"
import {Vec2} from "paintvec"
import {Texture} from "paintgl"
import {context} from "../GLContext"

export default
class Selection {
  readonly texture = new Texture(context, {size: this.size})
  readonly canvas = document.createElement("canvas")
  readonly context = this.canvas.getContext("2d")!

  constructor(public readonly size: Vec2) {
    this.canvas.width = size.width
    this.canvas.height = size.height
  }

  copyCanvasToTexture() {
    this.texture.setImage(this.canvas)
  }
}
