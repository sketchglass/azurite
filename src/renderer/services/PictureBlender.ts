import {reaction} from "mobx"
import Picture from "../models/Picture"
import {Vec2, Rect, Transform} from "paintvec"
import {Texture, TextureDrawTarget, Color} from "paintgl"
import {context} from "../GLContext"
import TiledTexture, {Tile} from "../models/TiledTexture"
import {drawTexture} from "../GLUtil"
import Dirtiness from "../../lib/Dirtiness"
import {layerBlender, ReplaceTile} from "./LayerBlender"

export default
class PictureBlender {
  private blendedTexture = new Texture(context, {
    size: this.picture.size,
    pixelFormat: "rgb",
    pixelType: "byte",
  })
  private drawTarget = new TextureDrawTarget(context, this.blendedTexture)

  dirtiness = new Dirtiness()

  get replaceTile() {
    return layerBlender.replaceTile
  }
  set replaceTile(f: ReplaceTile|undefined) {
    layerBlender.replaceTile = f
  }

  constructor(public picture: Picture) {
    this.dirtiness.addWhole()
    reaction(() => picture.size, size => {
      this.blendedTexture.size = size
    })
  }

  renderNow() {
    if (!this.dirtiness.dirty) {
      return
    }
    const rect = this.drawTarget.scissor = this.dirtiness.rect
    this.drawTarget.clear(new Color(1, 1, 1, 1))
    const tileKeys = TiledTexture.keysForRect(rect || new Rect(new Vec2(0), this.picture.size))
    for (const key of tileKeys) {
      const offset = key.mulScalar(Tile.width)
      const tileScissor = rect
        ? new Rect(rect.topLeft.sub(offset), rect.bottomRight.sub(offset)).intersection(Tile.rect)
        : undefined
      const rendered = layerBlender.blend(this.picture.layers, key, tileScissor)
      if (rendered) {
        drawTexture(this.drawTarget, layerBlender.blendedTile.texture, {transform: Transform.translate(offset), blendMode: "src-over"})
      }
    }
    this.dirtiness.clear()
  }

  getBlendedTexture() {
    this.renderNow()
    return this.blendedTexture
  }

  dispose() {
    this.drawTarget.dispose()
    this.blendedTexture.dispose()
  }
}
