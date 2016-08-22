import {Scene, PolygonModel, Polygon, PolygonUsage, TexturedPolygonShader} from "../../lib/GL"
import {context, canvas} from "../GLContext"
import Picture from "../models/Picture"
import {Vec2, Transform} from "../../lib/Geometry"

class Renderer {
  scene: Scene
  layerShader: TexturedPolygonShader
  layerModel: PolygonModel
  size = new Vec2(100, 100)
  transform = Transform.identity

  constructor(public picture: Picture) {
    this.scene = new Scene(context)
    const {width, height} = picture.size
    const vertices = new Float32Array([
      0, 0, 0, 0,
      width, 0, 1, 0,
      0, height, 0, 1,
      width, height, 1, 1
    ])
    const polygon = new Polygon(context, vertices, PolygonUsage.StaticDraw)
    this.layerShader = new TexturedPolygonShader(context)
    this.layerModel = new PolygonModel(context, polygon, this.layerShader)
  }

  resize(size: Vec2) {
    this.size = size
    canvas.width = size.width
    canvas.height = size.height
    context.resize()
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
