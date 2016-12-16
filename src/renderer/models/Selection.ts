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

  boundingRect() {
    const {width, height} = this.size
    const area = width * height
    const data = new Uint8Array(area * 4)
    this.drawTarget.readPixels(new Rect(new Vec2(), this.size), data)

    let hasOpaquePixel = false
    let left = 0, right = 0, top = 0, bottom = 0
    let i = 3
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const a = data[i]
        i += 4
        if (a != 0) {
          if (hasOpaquePixel) {
            left = Math.min(left, x)
            right = Math.max(right, x + 1)
            top = Math.min(top, y)
            bottom = Math.max(bottom, y + 1)
          } else {
            hasOpaquePixel = true
            left = x
            right = x + 1
            top = y
            bottom = y + 1
          }
        }
      }
    }
    if (hasOpaquePixel) {
      return new Rect(new Vec2(left, top), new Vec2(right, bottom))
    }
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
    this.hasSelection = !!this.boundingRect()
  }
}
