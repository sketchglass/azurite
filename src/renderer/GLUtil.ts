import {Vec2, Vec4} from "../lib/Geometry"
import {Texture, Geometry, GeometryUsage, Shader, Model, Framebuffer, DataType} from "../lib/GL"
import {context} from "./GLContext"

export
const unitGeometry = new Geometry(context, new Float32Array([
  -1, -1, 0, 0,
  1, -1, 1, 0,
  -1, 1, 0, 1,
  1, 1, 1, 1
]), [
  {attribute: "aPosition", size: 2},
  {attribute: "aTexCoord", size: 2},
],  new Uint16Array([
  0, 1, 2,
  1, 2, 3
]), GeometryUsage.Static)

const copyTextureShader = new Shader(context,
  `
    precision highp float;
    uniform vec2 uSrcSize;
    uniform vec2 uDestSize;
    uniform vec2 uOffset;
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
    void main(void) {
      vTexCoord = aTexCoord;
      vec2 posSrc = (aPosition + vec2(1.0)) * 0.5 * uSrcSize;
      vec2 posDest = posSrc - uOffset;
      vec2 pos = posDest / uDestSize * 2.0 - vec2(1.0);
      gl_Position = vec4(pos, 0.0, 1.0);
    }
  `,
  `
    precision mediump float;
    varying highp vec2 vTexCoord;
    uniform sampler2D uTexture;
    void main(void) {
      gl_FragColor = texture2D(uTexture, vTexCoord);
    }
  `
)
copyTextureShader.uniform("uTexture").setInt(0)

const copyTextureModel = new Model(context, unitGeometry, copyTextureShader)
const workingFramebuffer = new Framebuffer(context)

export
function copyTexture(src: Texture, dest: Texture, offset: Vec2) {
  copyTextureShader.uniform("uSrcSize").setVec2(src.size)
  copyTextureShader.uniform("uDestSize").setVec2(dest.size)
  copyTextureShader.uniform("uOffset").setVec2(offset)
  context.textureUnits.set(0, src)
  workingFramebuffer.setTexture(dest)
  workingFramebuffer.use()
  copyTextureModel.render()
  context.textureUnits.delete(0)
}

export
function copyNewTexture(src: Texture, rect: Vec4, type: DataType) {
  const texture = new Texture(context, rect.size, type)
  copyTexture(src, texture, rect.xy)
  return texture
}

export
function readTextureFloat(texture: Texture) {
  const data = new Float32Array(texture.size.width * texture.size.height * 4)
  workingFramebuffer.setTexture(texture)
  workingFramebuffer.use()
  context.readPixelsFloat(Vec4.fromVec2(new Vec2(0), texture.size), data)
  return data
}

// https://gist.github.com/martinkallman/5049614
function float32To16(floatAsUint: number) {
  const inu = floatAsUint

  let t1 = inu & 0x7fffffff;                 // Non-sign bits
  let t2 = inu & 0x80000000;                 // Sign bit
  let t3 = inu & 0x7f800000;                 // Exponent

  t1 >>= 13;                             // Align mantissa on MSB
  t2 >>= 16;                             // Shift sign bit into position

  t1 -= 0x1c000;                         // Adjust bias

  t1 = (t3 > 0x38800000) ? 0 : t1;       // Flush-to-zero
  t1 = (t3 < 0x8e000000) ? 0x7bff : t1;  // Clamp-to-max
  t1 = (t3 == 0 ? 0 : t1);               // Denormals-as-zero

  t1 |= t2;                              // Re-insert sign bit

  return t1
}

export
function float32ArrayTo16(data: Float32Array) {
  const src = new Uint32Array(data.buffer)
  const dst = new Uint16Array(data.length)
  for (let i = 0; i < data.length; ++i) {
    dst[i] = float32To16(src[i])
  }
  return dst
}
