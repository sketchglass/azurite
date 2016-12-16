import {observable} from "mobx"
import {Vec2, Rect, Transform} from "paintvec"
import {Texture, TextureDrawTarget, Color} from "paintgl"
import {context} from "../GLContext"
import {drawTexture} from "../GLUtil"

export default
class Selection {
  readonly texture = new Texture(context, {size: this.size})
  readonly drawTarget = new TextureDrawTarget(context, this.texture)
  @observable hasSelection = false

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

  selectAll() {
    this.drawTarget.clear(new Color(1, 1, 1, 1))
    this.hasSelection = true
  }

  invert() {
    const selection = new Selection(this.size)
    selection.hasSelection = this.hasSelection
    if (this.hasSelection) {
      selection.drawTarget.clear(new Color(1, 1, 1, 1))
      drawTexture(selection.drawTarget, this.texture, {blendMode: "dst-out"})
      selection.checkHasSelection()
    } else {
      selection.selectAll()
    }
    return selection
  }

  transform(newSize: Vec2, transform: Transform, opts: {bicubic?: boolean} = {}) {
    const selection = new Selection(newSize)
    selection.hasSelection = this.hasSelection
    if (this.hasSelection) {
      drawTexture(selection.drawTarget, this.texture, {blendMode: "src", transform, ...opts})
      selection.checkHasSelection()
    }
    return selection
  }

  clone() {
    const selection = new Selection(this.size)
    selection.hasSelection = this.hasSelection
    if (this.hasSelection) {
      drawTexture(selection.drawTarget, this.texture, {blendMode: "src"})
    }
    return selection
  }

  dispose() {
    this.drawTarget.dispose()
    this.texture.dispose()
  }

  checkHasSelection() {
    const area = this.size.width * this.size.height
    const data = new Uint8Array(area * 4)
    this.drawTarget.readPixels(new Rect(new Vec2(), this.size), data)
    for (let i = 0; i < area; ++i) {
      if (data[i * 4 + 3] != 0) {
        this.hasSelection = true
        return
      }
    }
    this.hasSelection = false
  }
}
