import {Vec2, Rect} from "paintvec"
import {Model, Texture, RectShape, TextureShader, DrawTarget, TextureDrawTarget, PixelType, BlendMode} from "paintgl"
import {context} from "./GLContext"

const drawTextureShape = new RectShape(context, {usage: "stream"})
const drawTextureModel = new Model(context, {
  shape: drawTextureShape,
  shader: TextureShader,
})

export
function drawTexture(dst: DrawTarget, texture: Texture, params: {offset?: Vec2, dstRect?: Rect, srcRect?: Rect, blendMode?: BlendMode}) {
  let {dstRect, srcRect} = params
  if (!dstRect) {
    const offset = params.offset || new Vec2(0)
    const {size} = texture
    dstRect = new Rect(offset, offset.add(size))
  }
  const texRect = srcRect
    ? new Rect(srcRect.topLeft.div(texture.size), srcRect.bottomRight.div(texture.size))
    : new Rect(new Vec2(0), new Vec2(1))
  drawTextureShape.rect = dstRect
  drawTextureShape.texCoords = texRect.vertices()
  drawTextureModel.blendMode = params.blendMode || "src-over"
  drawTextureModel.uniforms = {texture}
  dst.draw(drawTextureModel)
}
