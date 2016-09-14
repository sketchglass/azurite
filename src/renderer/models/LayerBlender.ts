import Picture from "./Picture"
import {Vec2, Vec4} from '../../lib/Geometry'
import {Texture, Framebuffer, Shader, Model, Geometry, GeometryUsage, DefaultFramebuffer} from "../../lib/GL"
import {context} from "../GLContext"
import {ColorShader, TextureShader} from "../GLUtil"

const layerShader = new TextureShader(context)
const backgroundShader = new ColorShader(context)
backgroundShader.uColor.setVec4(new Vec4(1))

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

const layerModel = new Model(context, geom, layerShader)
const backgroundModel = new Model(context, geom, backgroundShader)

export default
class LayerBlender {
  blendedTexture = new Texture(context, this.picture.size)
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
