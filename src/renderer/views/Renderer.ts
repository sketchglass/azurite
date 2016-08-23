import {Model, VertexBuffer, VertexBufferUsage, TextureShader, DefaultFramebuffer, ColorShader} from "../../lib/GL"
import {context, canvas} from "../GLContext"
import Picture from "../models/Picture"
import {Vec2, Vec4, Transform} from "../../lib/Geometry"

export default
class Renderer {
  layerShader: TextureShader
  layerModel: Model
  backgroundShader: ColorShader
  backgroundModel: Model
  size = new Vec2(100, 100)
  transform = Transform.identity

  constructor(public picture: Picture) {
    const {width, height} = picture.size
    const vertices = new Float32Array([
      -width * 0.5, -height * 0.5, 0, 0,
      width * 0.5, -height * 0.5, 1, 0,
      -width * 0.5, height * 0.5, 0, 1,
      width * 0.5, height * 0.5, 1, 1
    ])
    const buffer = new VertexBuffer(context, vertices, VertexBufferUsage.StaticDraw)
    this.layerShader = new TextureShader(context)
    this.layerModel = new Model(context, buffer, this.layerShader)
    context.setClearColor(new Vec4(0.9, 0.9, 0.9, 1))
    this.backgroundShader = new ColorShader(context)
    this.backgroundShader.setColor(new Vec4(1))
    this.backgroundModel = new Model(context, buffer, this.backgroundShader)
  }

  resize(size: Vec2) {
    this.size = size
    canvas.width = size.width
    canvas.height = size.height
    context.resize()
    this.render()
  }

  render() {
    new DefaultFramebuffer(context).use(() => {
      context.clear()
      const sceneToUnit = Transform.scale(new Vec2(2 / canvas.width, 2 / canvas.height))
      const transform = this.transform.merge(sceneToUnit)
      this.backgroundShader.setTransform(transform)
      this.backgroundModel.render()
      this.layerShader.setTransform(transform)
      this.layerShader.setTexture(0)
      for (const layer of this.picture.layers) {
        context.textureUnits.set(0, layer.texture)
        this.layerModel.render()
      }
      context.textureUnits.delete(0)
    })
  }
}
