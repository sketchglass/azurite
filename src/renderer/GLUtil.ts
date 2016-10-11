import {Vec2, Rect} from "paintvec"
import {Model, Texture, RectShape, TextureShader, TextureDrawTarget, PixelType} from "paintgl"
import {context} from "./GLContext"

const copyTextureShape = new RectShape(context, {usage: "stream"})
const copyTextureModel = new Model(context, {
  shape: copyTextureShape,
  shader: TextureShader,
  blendMode: "src",
})
const copyTextureDrawTarget = new TextureDrawTarget(context)

export
function copyTexture(src: Texture, dest: Texture, offset: Vec2) {
  copyTextureShape.rect = new Rect(offset.neg(), offset.neg().add(src.size))
  copyTextureModel.uniforms = {texture: src}
  copyTextureDrawTarget.texture = dest
  copyTextureDrawTarget.draw(copyTextureModel)
}

export
function copyNewTexture(src: Texture, rect: Rect, pixelType: PixelType) {
  const texture = new Texture(context, {size: rect.size, pixelType})
  copyTexture(src, texture, rect.topLeft)
  return texture
}

export
function readTextureFloat(texture: Texture) {
  const data = new Float32Array(texture.size.width * texture.size.height * 4)
  const target = new TextureDrawTarget(context, texture)
  target.readPixels(new Rect(new Vec2(), texture.size), data)
  return data
}
