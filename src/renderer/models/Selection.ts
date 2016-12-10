import {observable} from "mobx"
import {Vec2} from "paintvec"
import {Texture, TextureDrawTarget, BlendMode, Color} from "paintgl"
import {context} from "../GLContext"
import {drawTexture} from "../GLUtil"

export default
class Selection {
  readonly texture = new Texture(context, {size: this.size})
  readonly drawTarget = new TextureDrawTarget(context, this.texture)
  readonly canvas = document.createElement("canvas")
  readonly context = this.canvas.getContext("2d")!
  private readonly canvasTexture = new Texture(context, {size: this.size})

  constructor(public readonly size: Vec2) {
    this.canvas.width = size.width
    this.canvas.height = size.height
  }

  copyCanvasToTexture(blendMode: BlendMode) {
    this.canvasTexture.setImage(this.canvas)
    drawTexture(this.drawTarget, this.canvasTexture, {blendMode})
  }

  clear() {
    this.drawTarget.clear(new Color(0,0,0,0))
  }
}
