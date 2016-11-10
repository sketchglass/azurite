import {Vec2, Rect, Transform} from "paintvec"
import {Model, Texture, RectShape, Shader, TextureShader, DrawTarget, TextureDrawTarget, PixelType, BlendMode} from "paintgl"
import {context} from "./GLContext"

const drawTextureShape = new RectShape(context, {usage: "stream"})
const drawTextureModel = new Model(context, {
  shape: drawTextureShape,
  shader: TextureShader,
})

class TexturePerspectiveShader extends Shader {
  get vertexShader() {
    return `
      precision highp float;

      uniform mat3 transform;
      uniform mat3 transformPosition;
      uniform mat3 transformTexCoord;
      attribute vec2 aPosition;
      attribute vec2 aTexCoord;
      varying vec2 vPosition;
      varying vec3 vTexCoord;

      vec2 transform2(mat3 t, vec2 p) {
        vec3 result = t * vec3(p, 1.0);
        return result.xy / result.z;
      }

      void main(void) {
        vPosition = aPosition;
        vec2 pos = transform2(transformPosition, aPosition);
        vTexCoord = transformTexCoord * vec3(pos, 1.0);
        vec2 glPos = transform2(transform, pos);
        gl_Position = vec4(glPos, 0.0, 1.0);
      }
    `;
  }

  get fragmentShader() {
    return `
      precision mediump float;
      varying highp vec3 vTexCoord;
      uniform sampler2D texture;
      void main(void) {
        gl_FragColor = texture2D(texture, vTexCoord.xy / vTexCoord.z);
      }
    `
  }
}

const drawTexturePerspectiveModel = new Model(context, {
  shape: drawTextureShape,
  shader: TexturePerspectiveShader,
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
  const transform = params.transform || new Transform()
  const blendMode = params.blendMode || "src-over"
  if (transform.isAffine()) {
    drawTextureModel.transform = transform
    drawTextureModel.blendMode = blendMode
    drawTextureModel.uniforms = {texture: src}
    dst.draw(drawTextureModel)
  } else {
    const vertices = dstRect.vertices().map(v => v.transform(transform)) as [Vec2, Vec2, Vec2, Vec2]
    const transformTexCoord = Transform.quadToQuad(vertices, texCoords)
    if (!transformTexCoord) {
      return
    }
    drawTexturePerspectiveModel.blendMode = blendMode
    drawTexturePerspectiveModel.uniforms = {texture: src, transformPosition: transform, transformTexCoord}
    dst.draw(drawTexturePerspectiveModel)
  }
}

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
