import Picture from "./Picture"
import {Vec2, Rect, Transform} from "paintvec"
import {Model, Texture, TextureDrawTarget, Shader, TextureShader, RectShape, PixelType, Color} from "paintgl"
import {context} from "../GLContext"
import TiledTexture from "./TiledTexture"

const rectShape = new RectShape(context, {
  rect: new Rect(new Vec2(), new Vec2(TiledTexture.tileSize)),
})
const rectModel = new Model(context, {
  shape: rectShape,
  shader: TextureShader,
})

export default
class LayerBlender {
  blendedTexture = new Texture(context, {
    size: this.picture.size,
    pixelType: "half-float",
  })
  drawTarget = new TextureDrawTarget(context, this.blendedTexture)

  constructor(public picture: Picture) {
  }

  render(rect?: Rect) {
    const {layers} = this.picture
    this.drawTarget.scissor = rect
    this.drawTarget.clear(new Color(1, 1, 1, 1))
    const tileKeys = TiledTexture.keysForRect(rect || new Rect(new Vec2(0), this.picture.size))
    for (let i = layers.length - 1; i >= 0; --i) {
      const layer = layers[i]
      for (const key of tileKeys) {
        if (layer.tiledTexture.has(key)) {
          const offset = key.mulScalar(TiledTexture.tileSize)
          rectModel.transform = Transform.translate(offset)
          rectModel.uniforms = {texture: layer.tiledTexture.get(key)}
          this.drawTarget.draw(rectModel)
        }
      }
    }
  }
}
