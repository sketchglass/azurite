import {Vec2, Rect, Transform} from "paintvec"
import {Model, Texture, Shader, RectShape, QuadShape, TextureShader, DrawTarget, TextureDrawTarget, PixelType, BlendMode} from "paintgl"
import {context} from "./GLContext"

const drawTextureShape = new RectShape(context, {usage: "stream"})
const drawTextureModel = new Model(context, {
  shape: drawTextureShape,
  shader: TextureShader,
})

export
function drawTexture(dst: DrawTarget, src: Texture, params: {dstRect?: Rect, srcRect?: Rect, transform?: Transform, blendMode?: BlendMode}) {
  const {srcRect} = params
  const {size} = src
  const dstRect = params.dstRect || new Rect(new Vec2(), size)
  const texRect = srcRect
    ? new Rect(srcRect.topLeft.div(size), srcRect.bottomRight.div(size))
    : new Rect(new Vec2(0), new Vec2(1))

  if (!drawTextureShape.rect.equals(dstRect)) {
    drawTextureShape.rect = dstRect
  }
  const texCoords = texRect.vertices()
  if (!verticesEquals(drawTextureShape.texCoords, texCoords)) {
    drawTextureShape.texCoords = texCoords
  }
  drawTextureModel.transform = params.transform || new Transform()
  drawTextureModel.blendMode = params.blendMode || "src-over"
  drawTextureModel.uniforms = {texture: src}
  dst.draw(drawTextureModel)
}

export
function verticesEquals(xs: Vec2[], ys: Vec2[]) {
  if (xs.length != ys.length) {
    return false
  }
  for (let i = 0; i < xs.length; ++i) {
    if (!xs[i].equals(ys[i])) {
      return false
    }
  }
  return true
}
