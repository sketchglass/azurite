import {Vec2, Rect, Transform} from "paintvec"
import {Model, Texture, RectShape, TextureShader, DrawTarget, TextureDrawTarget, PixelType, BlendMode} from "paintgl"
import {context} from "./GLContext"

const drawTextureShape = new RectShape(context, {usage: "stream"})
const drawTextureModel = new Model(context, {
  shape: drawTextureShape,
  shader: TextureShader,
})

export
function drawTexture(dst: DrawTarget, src: Texture, params: {offset?: Vec2, dstRect?: Rect, srcRect?: Rect, transform?: Transform, blendMode?: BlendMode}) {
  let {dstRect, srcRect} = params
  const {size} = src
  if (!dstRect) {
    const offset = params.offset || new Vec2(0)
    dstRect = new Rect(offset, offset.add(size))
  }
  const texRect = srcRect
    ? new Rect(srcRect.topLeft.div(size), srcRect.bottomRight.div(size))
    : new Rect(new Vec2(0), new Vec2(1))
  drawTextureShape.rect = dstRect
  drawTextureShape.texCoords = texRect.vertices()
  drawTextureModel.transform = params.transform || new Transform()
  drawTextureModel.blendMode = params.blendMode || "src-over"
  drawTextureModel.uniforms = {texture: src}
  dst.draw(drawTextureModel)
}
