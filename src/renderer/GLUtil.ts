import {Vec2, Rect} from "paintvec"
import {Model, Texture, RectShape, TextureShader, DrawTarget, TextureDrawTarget, PixelType, BlendMode} from "paintgl"
import {context} from "./GLContext"

const drawTextureShape = new RectShape(context, {usage: "stream"})
const drawTextureModel = new Model(context, {
  shape: drawTextureShape,
  shader: TextureShader,
})

export
function drawTexture(target: DrawTarget, texture: Texture, offset: Vec2, blendMode: BlendMode) {
  drawTextureShape.rect = new Rect(offset, offset.add(texture.size))
  drawTextureModel.blendMode = blendMode
  drawTextureModel.uniforms = {texture}
  target.draw(drawTextureModel)
}
