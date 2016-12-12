import {observable} from "mobx"
import {Vec2, Rect, Transform} from "paintvec"
import {Texture, TextureDrawTarget, Color} from "paintgl"
import {context} from "../GLContext"
import {drawTexture} from "../GLUtil"

export default
class Selection {
  readonly texture = new Texture(context, {size: this.size})
  readonly drawTarget = new TextureDrawTarget(context, this.texture)
  @observable hasSelection = true

  constructor(public readonly size: Vec2) {
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

  transform(newSize: Vec2, transform: Transform, opts: {bicubic?: boolean} = {}) {
    const selection = new Selection(newSize)
    selection.hasSelection = this.hasSelection
    if (this.hasSelection) {
      drawTexture(selection.drawTarget, this.texture, {blendMode: "src", transform, ...opts})
    }
    return selection
  }

  clone() {
    return this.transform(this.size, new Transform())
  }

  dispose() {
    this.drawTarget.dispose()
    this.texture.dispose()
  }
}
