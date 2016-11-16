import {Vec2, Rect, Transform} from "paintvec"
import {Model, Texture, Shader, RectShape, QuadShape, TextureShader, DrawTarget, TextureDrawTarget, PixelType, BlendMode} from "paintgl"
import {context} from "./GLContext"

const drawTextureShape = new RectShape(context, {usage: "stream"})
const drawTextureModel = new Model(context, {
  shape: drawTextureShape,
  shader: TextureShader,
})

interface DrawTextureParams {
  dstRect?: Rect
  srcRect?: Rect
  transform?: Transform
  blendMode?: BlendMode
  nonAffine?: "inverse-bilinear" // TODO: "perspective"
}

type Quad = [Vec2, Vec2, Vec2, Vec2]

export
function drawTexture(dst: DrawTarget, src: Texture, params: DrawTextureParams) {
  const {size} = src
  const srcRect = params.srcRect || new Rect(new Vec2(), size)
  const dstRect = params.dstRect || new Rect(new Vec2(), size)
  const transform = params.transform || new Transform()

  if (!transform.isAffine()) {
    const quad = dstRect.vertices().map(v => v.transform(transform)) as Quad
    drawTextureInverseBilinear(dst, src, {quad, srcRect})
    return
  }

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

class InverseBilinearTextureShader extends Shader {
  get fragmentShader() {
    return `
      precision highp float;
      varying vec2 vPosition;
      uniform sampler2D texture;
      uniform vec2 a;
      uniform vec2 b;
      uniform vec2 c;
      uniform vec2 d;
      uniform vec2 uvOffset;
      uniform vec2 uvSize;

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

      void main(void) {
        vec2 uv = uvOffset + invBilinear(vPosition, a, b, c, d) * uvSize;
        mediump vec4 color = (uv.x > -0.5) ? texture2D(texture, uv) : vec4(0.0);
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


export
function drawTextureInverseBilinear(dst: DrawTarget, src: Texture, opts: {
  srcRect: Rect
  quad: Quad
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
    texture: src, a, b, c, d, uvOffset, uvSize
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
