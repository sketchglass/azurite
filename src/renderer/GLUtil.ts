import {Vec2, Rect} from "paintvec"
import {Model, Texture, RectShape, TextureShader, DrawTarget, TextureDrawTarget, PixelType, BlendMode} from "paintgl"
import {context} from "./GLContext"

const drawTextureShape = new RectShape(context, {usage: "stream"})
const drawTextureModel = new Model(context, {
  shape: drawTextureShape,
  shader: TextureShader,
})

export
function drawTexture(dst: DrawTarget, texture: Texture, params: {offset?: Vec2, dstRect?: Rect, blendMode?: BlendMode}) {
  let {dstRect} = params
  if (!dstRect) {
    const offset = params.offset || new Vec2(0)
    const {size} = texture
    dstRect = new Rect(offset, offset.add(size))
  }
  drawTextureShape.rect = dstRect
  drawTextureModel.blendMode = params.blendMode || "src-over"
  drawTextureModel.uniforms = {texture}
  dst.draw(drawTextureModel)
}
