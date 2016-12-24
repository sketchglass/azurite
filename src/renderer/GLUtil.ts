import {Vec2, Rect, Transform} from "paintvec"
import {ShapeModel, Texture, RectShape, QuadShape, textureShader, DrawTarget, TextureDrawTarget, BlendMode} from "paintgl"
import {context} from "./GLContext"
const glsl = require("glslify")

const bicubicTextureShader = {
  fragment: glsl`
    #pragma glslify: bicubic = require('../lib/glsl/bicubic.glsl')
    uniform sampler2D texture;
    uniform vec2 texSize;
    void fragmentMain(vec2 pos, vec2 uv, out vec4 color) {
      color = bicubic(texture, texSize, uv);
    }
  `
}

const drawTextureShape = new RectShape(context, {usage: "stream"})
const drawTextureModel = new ShapeModel(context, {
  shape: drawTextureShape,
  shader: textureShader,
})

const drawTextureBicubicModel = new ShapeModel(context, {
  shape: drawTextureShape,
  shader: bicubicTextureShader,
})

interface DrawTextureParams {
  dstRect?: Rect
  srcRect?: Rect
  transform?: Transform
  blendMode?: BlendMode
  nonAffine?: "inverse-bilinear" // TODO: "perspective"
  bicubic?: boolean
}

type Quad = [Vec2, Vec2, Vec2, Vec2]

export
function drawTexture(dst: DrawTarget, src: Texture, params: DrawTextureParams) {
  const srcRect = params.srcRect || new Rect(new Vec2(), src.size)
  const {size} = srcRect
  const dstRect = params.dstRect || new Rect(new Vec2(), size)
  const transform = params.transform || new Transform()
  const {bicubic} = params

  if (bicubic && src.filter !== "bilinear" && src.filter !== "mipmap-bilinear") {
    console.warn("src texture filter must be bilinear")
  }

  if (!transform.isAffine()) {
    const quad = dstRect.vertices().map(v => v.transform(transform)) as Quad
    drawTextureInverseBilinear(dst, src, {quad, srcRect, bicubic})
    return
  }

  const texRect = srcRect
    ? new Rect(srcRect.topLeft.div(src.size), srcRect.bottomRight.div(src.size))
    : new Rect(new Vec2(0), new Vec2(1))

  if (!drawTextureShape.rect.equals(dstRect)) {
    drawTextureShape.rect = dstRect
  }
  const texCoords = texRect.vertices()
  if (!verticesEquals(drawTextureShape.texCoords, texCoords)) {
    drawTextureShape.texCoords = texCoords
  }
  if (bicubic && !isTransformIntTranslation(transform)) {
    drawTextureBicubicModel.transform = transform
    drawTextureBicubicModel.blendMode = params.blendMode || "src-over"
    drawTextureBicubicModel.uniforms = {texture: src, texSize: src.size}
    dst.draw(drawTextureBicubicModel)
  } else {
    drawTextureModel.transform = transform
    drawTextureModel.blendMode = params.blendMode || "src-over"
    drawTextureModel.uniforms = {texture: src}
    dst.draw(drawTextureModel)
  }
}

function isTransformIntTranslation(transform: Transform) {
  const {m20, m21} = transform
  return transform.isTranslation() && Math.floor(m20) === m20 && Math.floor(m21) === m21
}

function verticesEquals(xs: Vec2[], ys: Vec2[]) {
  if (xs.length !== ys.length) {
    return false
  }
  for (let i = 0; i < xs.length; ++i) {
    if (!xs[i].equals(ys[i])) {
      return false
    }
  }
  return true
}

const inverseBilinearTextureShader = {
  fragment: glsl`
    uniform sampler2D texture;
    uniform vec2 texSize;
    uniform float useBicubic;
    uniform vec2 a;
    uniform vec2 b;
    uniform vec2 c;
    uniform vec2 d;
    uniform vec2 uvOffset;
    uniform vec2 uvSize;

    #pragma glslify: bicubic = require('../lib/glsl/bicubic.glsl')

    // http://www.iquilezles.org/www/articles/ibilinear/ibilinear.htm

    float cross(vec2 a, vec2 b) {
      return a.x*b.y - a.y*b.x;
    }

    vec2 invBilinear(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
      vec2 e = b-a;
      vec2 f = d-a;
      vec2 g = a-b+c-d;
      vec2 h = p-a;

      float k2 = cross( g, f );
      float k1 = cross( e, f ) + cross( h, g );
      float k0 = cross( h, e );

      float w = k1*k1 - 4.0*k0*k2;

      if( w<0.0 ) return vec2(-1.0);

      w = sqrt( w );

      if (abs(k2) < 0.001) {
        float v = -k0/k1;
        float u = (h.x - f.x*v)/(e.x + g.x*v);
        return vec2(u, v);
      }

      float v1 = (-k1 - w)/(2.0*k2);
      float v2 = (-k1 + w)/(2.0*k2);
      float u1 = (h.x - f.x*v1)/(e.x + g.x*v1);
      float u2 = (h.x - f.x*v2)/(e.x + g.x*v2);
      bool  b1 = v1>0.0 && v1<1.0 && u1>0.0 && u1<1.0;
      bool  b2 = v2>0.0 && v2<1.0 && u2>0.0 && u2<1.0;

      vec2 res = vec2(-1.0);

      if(  b1 && !b2 ) res = vec2( u1, v1 );
      if( !b1 &&  b2 ) res = vec2( u2, v2 );

      return res;
    }

    void fragmentMain(vec2 pos, vec2 texCoord, out vec4 color) {
      vec2 uv = uvOffset + invBilinear(pos, a, b, c, d) * uvSize;
      color = (useBicubic == 1.0) ? bicubic(texture, texSize, uv) : texture2D(texture, uv);
    }
  `
}

const inverseBilinearShape = new QuadShape(context, {usage: "stream"})
const inverseBilinearModel = new ShapeModel(context, {
  shape: inverseBilinearShape,
  shader: inverseBilinearTextureShader,
})

function drawTextureInverseBilinear(dst: DrawTarget, src: Texture, opts: {
  srcRect: Rect
  quad: Quad
  bicubic?: boolean
}) {
  const {quad, srcRect} = opts
  const uvOffset = srcRect.topLeft.div(src.size)
  const uvSize = srcRect.size.div(src.size)

  // normalize quad to reduce errors in invBilinear as possible
  const [normalizedQuad, transformToOriginal] = normalizeQuad(quad)
  if (!verticesEquals(inverseBilinearShape.positions, normalizedQuad)) {
    inverseBilinearShape.positions = normalizedQuad
  }
  inverseBilinearModel.transform = transformToOriginal
  const [a, b, c, d] = normalizedQuad
  inverseBilinearModel.uniforms = {
    texture: src,
    texSize: src.size,
    useBicubic: opts.bicubic ? 1 : 0,
    a, b, c, d, uvOffset, uvSize
  }
  dst.draw(inverseBilinearModel)
}

function normalizeQuad(quad: Quad): [Quad, Transform] {
  const rect = Rect.fromQuad(quad)
  const transformToOriginal = Transform.scale(rect.size).translate(rect.center)
  const transformToNormalized = transformToOriginal.invert() || new Transform()
  const retQuad = quad.map(q => q.transform(transformToNormalized)) as [Vec2, Vec2, Vec2, Vec2]
  return [retQuad, transformToOriginal]
}

export function duplicateTexture(texture: Texture) {
  const result = new Texture(context, {size: texture.size, pixelType: texture.pixelType, pixelFormat: texture.pixelFormat})
  const drawTarget = new TextureDrawTarget(context, result)
  drawTexture(drawTarget, texture, {blendMode: "src"})
  drawTarget.dispose()
  return result
}

const visiblityToBinaryShader = {
  fragment: `
    uniform sampler2D srcTexture;
    uniform vec2 srcSize;

    void fragmentMain(vec2 vpos, vec2 uv, out vec4 color) {
      vec2 texelSize = 1.0 / srcSize;
      vec2 pos = gl_FragCoord.xy - 0.5;
      vec2 texPos = pos * vec2(32.0, 1.0) + 0.5;
      vec2 texCoord = texPos * texelSize;

      for (int i = 0; i < 4; ++i) {
        float value = 0.0;
        for (int j = 0; j < 8; ++j) {
          bool opaque = texture2D(srcTexture, texCoord).a > 0.0;
          bool inside = texCoord.x < 1.0;
          value *= 0.5;
          value += (opaque && inside) ? 128.0 : 0.0;
          texCoord += vec2(texelSize.x, 0.0);
        }
        color[i] = value / 255.0;
      }
    }
  `
}

const visibilityToBinaryShape = new RectShape(context)
const visibilityToBinaryModel = new ShapeModel(context, {
  shape: visibilityToBinaryShape,
  shader: visiblityToBinaryShader,
  blendMode: "src",
})

export function drawVisibilityToBinary(drawTarget: DrawTarget, src: Texture) {
  const width = Math.ceil(src.size.width / 32)
  const height = src.size.height
  const rect = new Rect(new Vec2(), new Vec2(width, height))
  if (!visibilityToBinaryShape.rect.equals(rect)) {
    visibilityToBinaryShape.rect = rect
  }
  visibilityToBinaryModel.uniforms = {
    srcTexture: src,
    srcSize: src.size,
  }
  drawTarget.draw(visibilityToBinaryModel)
}

const binaryToVisibilityShader = {
  fragment: `
    uniform sampler2D srcTexture;
    uniform vec2 srcSize;

    bool isOdd(int x) {
      int r = x / 2;
      return x - r * 2 == 1;
    }

    void fragmentMain(vec2 vpos, vec2 uv, out vec4 color) {
      vec2 pos = gl_FragCoord.xy - 0.5;
      vec2 srcPos = pos * vec2(1.0 / 32.0, 1.0);
      vec2 srcTexCoord = (floor(srcPos) + 0.5) / srcSize;
      vec4 srcColor = texture2D(srcTexture, srcTexCoord);
      int bitOffset = int(fract(srcPos.x) * 32.0);

      bool on = false;
      int offset = 0;
      for (int i = 0; i < 4; ++i) {
        int c = int(srcColor[i] * 255.0 + 0.5);
        for (int j = 0; j < 8; ++j) {
          if (offset == bitOffset && isOdd(c)) {
            on = true;
          }
          c /= 2;
          ++offset;
        }
      }
      color = vec4(float(on));
    }
  `
}

const binaryToVisibilityShape = new RectShape(context)

const binaryToVisibilityModel = new ShapeModel(context, {
  shape: binaryToVisibilityShape,
  shader: binaryToVisibilityShader,
  blendMode: "src",
})

export function drawBinaryToVisibility(drawTarget: DrawTarget, src: Texture) {
  const rect = new Rect(new Vec2(), drawTarget.size)
  if (!binaryToVisibilityShape.rect.equals(rect)) {
    binaryToVisibilityShape.rect = rect
  }
  binaryToVisibilityModel.uniforms = {
    srcTexture: src,
    srcSize: src.size,
  }
  drawTarget.draw(binaryToVisibilityModel)
}
