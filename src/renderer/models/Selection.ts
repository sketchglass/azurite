import {observable} from "mobx"
import {Vec2, Rect, Transform} from "paintvec"
import {Texture, TextureDrawTarget, Color} from "paintgl"
import {context} from "../GLContext"
import {drawTexture, drawVisibilityToBinary} from "../GLUtil"
import {getBoundingRect} from "./util"

const binaryTexture = new Texture(context, {})
const binaryDrawTarget = new TextureDrawTarget(context, binaryTexture)

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
    const binaryWidth = Math.ceil(this.size.width / 32)
    const binarySize = new Vec2(binaryWidth, this.size.height)
    if (!binaryTexture.size.equals(binarySize)) {
      binaryTexture.size = binarySize
    }
    drawVisibilityToBinary(binaryDrawTarget, this.texture)

    const data = new Int32Array(binarySize.width * binarySize.height)
    binaryDrawTarget.readPixels(new Rect(new Vec2(), binarySize), new Uint8Array(data.buffer))
    return getBoundingRect(data, this.size)
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
      if (opts.bicubic) {
        this.texture.filter = "bilinear"
      }
      drawTexture(selection.drawTarget, this.texture, {blendMode: "src", transform, ...opts})
      if (opts.bicubic) {
        this.texture.filter = "nearest"
      }
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
