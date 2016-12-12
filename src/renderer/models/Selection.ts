import {observable} from "mobx"
import {Vec2, Rect} from "paintvec"
import {Texture, TextureDrawTarget, Color} from "paintgl"
import {context} from "../GLContext"
import {duplicateTexture, drawTexture} from "../GLUtil"

export default
class Selection {
  readonly texture = new Texture(context, {})
  readonly drawTarget = new TextureDrawTarget(context, this.texture)
  @observable hasSelection = true

  get size() {
    return this.texture.size
  }
  set size(size: Vec2) {
    this.texture.size = size
  }

  includes(pos: Vec2) {
    const floored = pos.floor()
    const data = new Uint8Array(4)
    this.drawTarget.readPixels(new Rect(floored, floored.add(new Vec2(1))), data)
    const alpha = data[3]
    return alpha > 0
  }

  clear() {
    this.drawTarget.clear(new Color(0, 0, 0, 0))
    this.hasSelection = false
  }
}
