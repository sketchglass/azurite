import Picture from "./Picture"
import {Vec2, Vec4} from '../../lib/Geometry'
import {Texture, Framebuffer, Shader, Model, DefaultFramebuffer, DataType} from "../../lib/GL"
import {context} from "../GLContext"
import {unitGeometry} from "../GLUtil"

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

const layerFrag = `
  precision mediump float;
  varying highp vec2 vTexCoord;
  uniform sampler2D uTexture;
  void main(void) {
    gl_FragColor = texture2D(uTexture, vTexCoord);
  }
`

const backgroundFrag = `
  precision mediump float;
  void main(void) {
    gl_FragColor = vec4(1.0);
  }
`

const layerShader = new Shader(context, vert, layerFrag)
layerShader.uniform("uTexture").setInt(0)
const backgroundShader = new Shader(context, vert, backgroundFrag)

const layerModel = new Model(context, unitGeometry, layerShader)
const backgroundModel = new Model(context, unitGeometry, backgroundShader)

export default
class LayerBlender {
  blendedTexture = new Texture(context, this.picture.size, DataType.HalfFloat)
  framebuffer = new Framebuffer(context, this.blendedTexture)

  constructor(public picture: Picture) {
  }

  render(rect: Vec4|undefined) {
    const {layers} = this.picture
    this.framebuffer.use()
    if (rect) {
      context.setScissor(rect)
    }
    backgroundModel.render()
    for (let i = layers.length - 1; i >= 0; --i) {
      context.textureUnits.set(0, layers[i].texture)
      layerModel.render()
    }
    context.textureUnits.delete(0)
    context.clearScissor()
  }
}
