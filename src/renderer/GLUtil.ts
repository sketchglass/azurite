import {Vec2, Rect, Transform} from "paintvec"
import {Model, Texture, Shader, RectShape, QuadShape, TextureShader, DrawTarget, TextureDrawTarget, BlendMode} from "paintgl"
import {context} from "./GLContext"

// http://www.java-gaming.org/index.php?topic=35123.0

const textureBicubic = `
  vec4 cubic(float v) {
    vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
    vec4 s = n * n * n;
    float x = s.x;
    float y = s.y - 4.0 * s.x;
    float z = s.z - 4.0 * s.y + 6.0 * s.x;
    float w = 6.0 - x - y - z;
    return vec4(x, y, z, w) * (1.0/6.0);
  }

  mediump vec4 textureBicubic(sampler2D sampler, vec2 texSize, vec2 texCoords) {
    vec2 invTexSize = 1.0 / texSize;
    texCoords = texCoords * texSize - 0.5;

    vec2 fxy = fract(texCoords);
    texCoords -= fxy;

    vec4 xcubic = cubic(fxy.x);
    vec4 ycubic = cubic(fxy.y);

    vec4 c = texCoords.xxyy + vec2(-0.5, +1.5).xyxy;

    vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
    vec4 offset = c + vec4(xcubic.yw, ycubic.yw) / s;

    offset *= invTexSize.xxyy;

    mediump vec4 sample0 = texture2D(sampler, offset.xz);
    mediump vec4 sample1 = texture2D(sampler, offset.yz);
    mediump vec4 sample2 = texture2D(sampler, offset.xw);
    mediump vec4 sample3 = texture2D(sampler, offset.yw);

    float sx = s.x / (s.x + s.y);
    float sy = s.z / (s.z + s.w);

    return mix(
      mix(sample3, sample2, sx), mix(sample1, sample0, sx)
    , sy);
  }
`

class BicubicTextureShader extends Shader {
  get fragmentShader() {
    return `
      precision highp float;
      varying vec2 vTexCoord;
      uniform sampler2D texture;
      uniform vec2 texSize;
      ${textureBicubic}
      void main(void) {
        gl_FragColor = textureBicubic(texture, texSize, vTexCoord);
      }
    `
  }
}

const drawTextureShape = new RectShape(context, {usage: "stream"})
const drawTextureModel = new Model(context, {
  shape: drawTextureShape,
  shader: TextureShader,
})

const drawTextureBicubicModel = new Model(context, {
  shape: drawTextureShape,
  shader: BicubicTextureShader,
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

class InverseBilinearTextureShader extends Shader {
  get fragmentShader() {
    return `
      precision highp float;
      varying vec2 vPosition;
      uniform sampler2D texture;
      uniform vec2 texSize;
      uniform float useBicubic;
      uniform vec2 a;
      uniform vec2 b;
      uniform vec2 c;
      uniform vec2 d;
      uniform vec2 uvOffset;
      uniform vec2 uvSize;

      // http://www.iquilezles.org/www/articles/ibilinear/ibilinear.htm

      ${textureBicubic}

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

      void main(void) {
        vec2 uv = uvOffset + invBilinear(vPosition, a, b, c, d) * uvSize;
        mediump vec4 color = (useBicubic == 1.0) ? textureBicubic(texture, texSize, uv) : texture2D(texture, uv);
        gl_FragColor = color;
      }
    `
  }
}

const inverseBilinearShape = new QuadShape(context, {usage: "stream"})
const inverseBilinearModel = new Model(context, {
  shape: inverseBilinearShape,
  shader: InverseBilinearTextureShader,
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

class VisiblityToBinaryShader extends Shader {
  get fragmentShader() {
    return `
      precision highp float;
      uniform sampler2D texture;
      uniform vec2 texSize;

      void main(void) {
        vec2 texelSize = 1.0 / texSize;
        vec2 pos = gl_FragCoord.xy - 0.5;
        vec2 texPos = pos * vec2(32.0, 1.0) + 0.5;
        vec2 texCoord = texPos * texelSize;

        for (int i = 0; i < 4; ++i) {
          float value = 0.0;
          for (int j = 0; j < 8; ++j) {
            bool opaque = texture2D(texture, texCoord).a > 0.0;
            bool inside = texCoord.x < 1.0;
            value *= 0.5;
            value += (opaque && inside) ? 128.0 : 0.0;
            texCoord += vec2(texelSize.x, 0.0);
          }
          gl_FragColor[i] = value / 255.0;
        }
      }
    `
  }
}

const visibilityToBinaryShape = new RectShape(context)
const visibilityToBinaryModel = new Model(context, {
  shape: visibilityToBinaryShape,
  shader: VisiblityToBinaryShader,
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
    texture: src,
    texSize: src.size,
  }
  drawTarget.draw(visibilityToBinaryModel)
}

class BinaryToVisibilityShader extends Shader {
  get fragmentShader() {
    return `
      precision highp float;
      uniform sampler2D srcTexture;
      uniform vec2 srcSize;

      bool isOdd(int x) {
        int r = x / 2;
        return x - r * 2 == 1;
      }

      void main(void) {
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
        gl_FragColor = vec4(float(on));
      }
    `
  }
}

const binaryToVisibilityShape = new RectShape(context)

const binaryToVisibilityModel = new Model(context, {
  shape: binaryToVisibilityShape,
  shader: BinaryToVisibilityShader,
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
