import {observable} from "mobx"
import {Vec2} from "paintvec"
import {Texture, TextureDrawTarget, BlendMode, Color} from "paintgl"
import {context} from "../GLContext"
import {drawTexture} from "../GLUtil"

export default
class Selection {
  readonly texture = new Texture(context, {})
  readonly drawTarget = new TextureDrawTarget(context, this.texture)

  get size() {
    return this.texture.size
  }
  set size(size: Vec2) {
    this.texture.size = size
  }

  clear() {
    this.drawTarget.clear(new Color(0,0,0,0))
  }
}
