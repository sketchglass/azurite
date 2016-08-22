import {UVModel, VertexBuffer, PolygonUsage, TexturedPolygonShader} from "../../lib/GL"
import {context, canvas} from "../GLContext"
import Picture from "../models/Picture"
import {Vec2, Vec4, Transform} from "../../lib/Geometry"

export default
class Renderer {
  layerShader: TexturedPolygonShader
  layerModel: UVModel
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
    const buffer = new VertexBuffer(context, vertices, PolygonUsage.StaticDraw)
    this.layerShader = new TexturedPolygonShader(context)
    this.layerModel = new UVModel(context, buffer, this.layerShader)
    context.setClearColor(new Vec4(0.9, 0.9, 0.9, 1))
  }

  resize(size: Vec2) {
    this.size = size
    canvas.width = size.width
    canvas.height = size.height
    context.resize()
    this.render()
  }

  render() {
    context.clear()
    const sceneToUnit = Transform.scale(new Vec2(2 / canvas.width, 2 / canvas.height))
    const transform = this.transform.merge(sceneToUnit)
    this.layerShader.setTransform(transform)
    for (const layer of this.picture.layers) {
      this.layerShader.setTexture(layer.texture)
      this.layerModel.render()
    }
  }
}
