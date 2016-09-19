import {Vec2, Vec4} from "../lib/Geometry"
import {Texture, Geometry, GeometryUsage, Shader, Model, Framebuffer, DataType, BlendMode} from "../lib/GL"
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
copyTextureModel.setBlendMode(BlendMode.Src)
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
