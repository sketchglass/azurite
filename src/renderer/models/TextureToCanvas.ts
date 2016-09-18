import {Vec2, Vec4} from "../../lib/Geometry"
import {Texture, Shader, Geometry, Model, DataType, GeometryUsage, Framebuffer, BlendMode} from "../../lib/GL"
import {context} from "../GLContext"

const vert = `
  precision highp float;
  attribute vec2 aPosition;
  attribute vec2 aTexCoord;
  varying vec2 vTexCoord;
  void main(void) {
    vTexCoord = aTexCoord;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

const frag = `
  precision mediump float;
  varying highp vec2 vTexCoord;
  uniform sampler2D uTexture;
  uniform vec4 uBackground;
  void main(void) {
    vec4 texColor = texture2D(uTexture, vTexCoord);
    vec4 color = texColor + uBackground * (1.0 - texColor.a);
    vec4 nonPremultColor = vec4(color.rgb / color.a, color.a);
    gl_FragColor = nonPremultColor;
  }
`

const shader = new Shader(context, vert, frag)
shader.uniform("uTexture").setInt(0)

const geom = new Geometry(context, new Float32Array([
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

const model = new Model(context, geom, shader)
model.setBlendMode(BlendMode.Src)

// render texture content to canvas element
export default
class TextureToCanvas {
  canvas = document.createElement("canvas")
  context = this.canvas.getContext("2d")!
  backgroundColor = new Vec4(1)
  imageData = new ImageData(this.size.width, this.size.height)
  texture = new Texture(context, this.size, DataType.Byte)
  framebuffer = new Framebuffer(context, this.texture)

  constructor(public size: Vec2) {
    this.canvas.width = size.width
    this.canvas.height = size.height
  }

  loadTexture(texture: Texture) {
    this.framebuffer.use()
    context.textureUnits.set(0, texture)
    shader.uniform("uBackground").setVec4(this.backgroundColor)
    model.render()
    context.textureUnits.delete(0)
    context.readPixels(Vec4.fromVec2(new Vec2(0), this.size), new Uint8Array(this.imageData.data.buffer))
    this.context.putImageData(this.imageData, 0, 0)
  }
}
