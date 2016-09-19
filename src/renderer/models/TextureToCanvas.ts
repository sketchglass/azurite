import {Vec2, Vec4} from "../../lib/Geometry"
import {Texture, Shader, Model, DataType, Framebuffer, BlendMode} from "../../lib/GL"
import {context} from "../GLContext"
import {unitGeometry} from "../GLUtil"

const shader = new Shader(context,
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
      vec2 posDest = posSrc + uOffset;
      vec2 pos = posDest / uDestSize * 2.0 - vec2(1.0);
      gl_Position = vec4(pos, 0.0, 1.0);
    }
  `,
  `
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
)
shader.uniform("uTexture").setInt(0)

const model = new Model(context, unitGeometry, shader)
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

  clear() {
    this.framebuffer.use()
    context.setClearColor(this.backgroundColor)
    context.clear()
  }

  loadTexture(texture: Texture, offset: Vec2) {
    this.framebuffer.use()
    context.textureUnits.set(0, texture)
    shader.uniform("uBackground").setVec4(this.backgroundColor)
    shader.uniform("uDestSize").setVec2(this.size)
    shader.uniform("uSrcSize").setVec2(texture.size)
    shader.uniform("uOffset").setVec2(offset)
    model.render()
    context.textureUnits.delete(0)
    context.readPixelsByte(Vec4.fromVec2(new Vec2(0), this.size), new Uint8Array(this.imageData.data.buffer))
    this.context.putImageData(this.imageData, 0, 0)
  }

  dispose() {
    this.texture.dispose()
    this.framebuffer.dispose()
  }
}
