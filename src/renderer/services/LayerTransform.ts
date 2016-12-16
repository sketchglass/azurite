import {Vec2, Rect, Transform} from "paintvec"
import {Texture, TextureDrawTarget, Color} from "paintgl"
import TiledTexture, {Tile} from "../models/TiledTexture"
import Selection from "../models/Selection"
import {context} from "../GLContext"
import {drawTexture} from "../GLUtil"

const tileDrawTarget = new TextureDrawTarget(context)

export default
class LayerTransform {
  readonly boundingRect = this.selection.hasSelection ? this.selection.boundingRect() : this.tiledTexture.boundingRect()
  transform = new Transform()
  readonly texture: Texture|undefined
  readonly textureSubrect = new Rect()

  constructor(public readonly tiledTexture: TiledTexture, public readonly selection: Selection) {
    if (this.boundingRect) {
      // TODO: support image larger than max texture size
      const textureRect = this.boundingRect.inflate(2)
      const texture = this.texture = new Texture(context, {size: textureRect.size, pixelType: "half-float"})
      const drawTarget = new TextureDrawTarget(context, texture)
      this.tiledTexture.drawToDrawTarget(drawTarget, {offset: textureRect.topLeft.neg(), blendMode: "src"})
      if (this.selection.hasSelection) {
        // clip with texture
        drawTexture(drawTarget, this.selection.texture, {blendMode: "dst-in", transform: Transform.translate(textureRect.topLeft.neg())})
      }
      texture.filter = "bilinear"
      this.textureSubrect = new Rect(new Vec2(), textureRect.size).inflate(-2)
      drawTarget.dispose()
    }
  }

  transformToTile(tile: Tile, tileKey: Vec2) {
    if (!this.boundingRect || !this.texture) {
      return
    }
    tileDrawTarget.texture = tile.texture
    tileDrawTarget.clear(new Color(0, 0, 0, 0))
    const tileOffset = tileKey.mulScalar(-Tile.width)
    const transform = Transform.translate(this.boundingRect.topLeft)
      .merge(this.transform)
      .translate(tileOffset)

    if (this.selection.hasSelection) {
      // draw original before draw transformed image
      if (this.tiledTexture.has(tileKey)) {
        drawTexture(tileDrawTarget, this.tiledTexture.get(tileKey).texture, {blendMode: "src"})
        drawTexture(tileDrawTarget, this.selection.texture, {blendMode: "dst-out", transform: Transform.translate(tileOffset)})
      }
      drawTexture(tileDrawTarget, this.texture, {transform, blendMode: "src-over", bicubic: true, srcRect: this.textureSubrect})
    } else {
      drawTexture(tileDrawTarget, this.texture, {transform, blendMode: "src", bicubic: true, srcRect: this.textureSubrect})
    }
    tileDrawTarget.texture = undefined
  }

  transformToTiledTexture() {
    const result = new TiledTexture()
    if (!this.boundingRect || !this.texture) {
      return result
    }
    let rect = this.boundingRect.transform(this.transform)
    const tileKeys = new Set(TiledTexture.keysForRect(rect))
    if (this.selection.hasSelection) {
      for (const key of this.tiledTexture.keys()) {
        tileKeys.add(key)
      }
    }
    for (const key of tileKeys) {
      this.transformToTile(result.get(key), key)
    }
    result.shrink()
    return result
  }

  dispose() {
    if (this.texture) {
      this.texture.dispose()
    }
  }
}