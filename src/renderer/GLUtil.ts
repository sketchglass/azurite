import {Vec2, Rect} from "paintvec"
import {Model, Texture, RectShape, TextureShader, DrawTarget, TextureDrawTarget, PixelType, BlendMode} from "paintgl"
import {context} from "./GLContext"

const drawTextureShape = new RectShape(context, {usage: "stream"})
const drawTextureModel = new Model(context, {
  shape: drawTextureShape,
  shader: TextureShader,
})

export
function drawTexture(target: DrawTarget, texture: Texture, params: {offset?: Vec2, rect?: Rect, blendMode?: BlendMode}) {
  let rect: Rect
  if (params.rect) {
    rect = params.rect
  } else {
    const offset = params.offset || new Vec2(0)
    const {size} = texture
    rect = new Rect(offset, offset.add(size))
  }
  drawTextureShape.rect = rect
  drawTextureModel.blendMode = params.blendMode || "src-over"
  drawTextureModel.uniforms = {texture}
  target.draw(drawTextureModel)
}
