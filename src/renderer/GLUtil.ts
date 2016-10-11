import {Vec2, Rect} from "paintvec"
import {Model, Texture, RectShape, TextureShader, TextureDrawTarget, PixelType} from "paintgl"
import {context} from "./GLContext"

export
function copyTexture(src: Texture, dest: Texture, offset: Vec2) {
  const shape = new RectShape(context, {
    rect: new Rect(offset.neg(), offset.neg().add(src.size)),
  })
  const model = new Model(context, {
    shape,
    shader: TextureShader,
    uniforms: {
      texture: src,
    },
    blendMode: "src",
  })

  const target = new TextureDrawTarget(context, dest)
  target.draw(model)

  shape.dispose()
  target.dispose()
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
