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

class TransformTextureShader extends Shader {
  get fragmentShader() {
    return `
      precision mediump float;
      varying highp vec2 vTexCoord;
      uniform sampler2D texture;
      uniform vec2 a;
      uniform vec2 b;
      uniform vec2 c;
      uniform vec2 d;

      // http://www.iquilezles.org/www/articles/ibilinear/ibilinear.htm

      float cross( in vec2 a, in vec2 b ) { return a.x*b.y - a.y*b.x; }

      vec2 invBilinear( in vec2 p, in vec2 a, in vec2 b, in vec2 c, in vec2 d )
      {
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
        vec2 uv = invBilinear(p, a, b, c, d);
        vec4 color = (uv.x > -0.5) ? texture2D(texture, uv) : vec4(0.0);
        gl_FragColor = color;
      }
    `
  }
}

const transformTextureShape = new QuadShape(context, {usage: "stream"})
const transformTextureModel = new Model(context, {
  shape: transformTextureShape,
  shader: TransformTextureShader,
})

export
function transformTexture(dst: DrawTarget, src: Texture, opts: {
  srcQuad: [Vec2, Vec2, Vec2, Vec2],
  offset: Vec2
}) {
  const {srcQuad, offset} = opts
  if (!verticesEquals(transformTextureShape.positions, srcQuad)) {
    transformTextureShape.positions = srcQuad
  }
  transformTextureModel.transform = Transform.translate(offset)
  const [a, b, c, d] = srcQuad
  transformTextureModel.uniforms = {
    texture: src, a, b, c, d
  }
  dst.draw(transformTextureModel)
}
