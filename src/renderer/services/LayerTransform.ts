import {Vec2, Rect, Transform} from "paintvec"
import {Texture, TextureDrawTarget, Color} from "paintgl"
import TiledTexture, {Tile} from "../models/TiledTexture"
import {context} from "../GLContext"
import {drawTexture} from "../GLUtil"

const tileDrawTarget = new TextureDrawTarget(context)

export default
class LayerTransform {
  readonly rect = this.tiledTexture.boundingRect()
  transform = new Transform()
  readonly texture: Texture|undefined
  readonly textureSubrect = new Rect()

  constructor(public readonly tiledTexture: TiledTexture) {
    if (this.rect) {
      // TODO: support image larger than max texture size
      const textureRect = this.rect.inflate(2)
      this.texture = this.tiledTexture.cropToTexture(textureRect)
      this.textureSubrect = new Rect(new Vec2(), textureRect.size).inflate(-2)
      this.texture.filter = "bilinear"
    }
  }

  transformToTile(tile: Tile, tileKey: Vec2) {
    if (!this.rect || !this.texture) {
      return
    }
    tileDrawTarget.texture = tile.texture
    tileDrawTarget.clear(new Color(0, 0, 0, 0))
    const transform = Transform.translate(this.rect.topLeft)
      .merge(this.transform)
      .translate(tileKey.mulScalar(-Tile.width))

    drawTexture(tileDrawTarget, this.texture, {transform, blendMode: "src", bicubic: true, srcRect: this.textureSubrect})
    tileDrawTarget.texture = undefined
  }

  transformToTiledTexture() {
    const newTiledTexture = new TiledTexture()
    if (!this.rect || !this.texture) {
      return newTiledTexture
    }
    const transform = Transform.translate(this.rect.topLeft).merge(this.transform)
    newTiledTexture.drawTexture(this.texture, {transform, blendMode: "src", bicubic: true, srcRect: this.textureSubrect})
    return newTiledTexture
  }

  dispose() {
    if (this.texture) {
      this.texture.dispose()
    }
  }
}