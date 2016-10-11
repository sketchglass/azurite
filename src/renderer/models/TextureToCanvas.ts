import {Vec2, Rect} from "paintvec"
import {Texture, Shader, RectShape, TextureDrawTarget, Color} from "paintgl"
import {context} from "../GLContext"

class TextureToCanvasShader extends Shader {
  get fragmentShader() {
    return `
      precision mediump float;
      varying highp vec2 vTexCoord;
      uniform sampler2D texture;
      uniform vec4 background;
      void main(void) {
        vec4 texColor = texture2D(texture, vTexCoord);
        vec4 color = texColor + background * (1.0 - texColor.a);
        vec4 nonPremultColor = vec4(color.rgb / color.a, color.a);
        gl_FragColor = nonPremultColor;
      }
    `
  }
}

// render texture content to canvas element
export default
class TextureToCanvas {
  canvas = document.createElement("canvas")
  context = this.canvas.getContext("2d")!
  backgroundColor = new Color(1, 1, 1, 1)
  imageData = new ImageData(this.size.width, this.size.height)
  texture = new Texture(context, {size: this.size})
  drawTarget = new TextureDrawTarget(context, this.texture)
  shape = new RectShape(context, {
    usage: "static",
    rect: new Rect(new Vec2(), this.size),
    shader: TextureToCanvasShader,
  })

  constructor(public size: Vec2) {
    this.canvas.width = size.width
    this.canvas.height = size.height
  }

  clear() {
    this.drawTarget.clear(this.backgroundColor)
  }

  loadTexture(texture: Texture, offset: Vec2) {
    this.shape.rect = new Rect(offset, offset.add(texture.size))
    this.shape.uniforms["texture"] = texture
    this.drawTarget.draw(this.shape)
  }

  updateCanvas() {
    this.drawTarget.readPixels(new Rect(new Vec2(0), this.size), new Uint8Array(this.imageData.data.buffer))
    this.context.putImageData(this.imageData, 0, 0)
  }

  dispose() {
    this.shape.dispose()
    this.drawTarget.dispose()
    this.texture.dispose()
  }
}
