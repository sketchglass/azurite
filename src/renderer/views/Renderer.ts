import {TextureShader, Model, RectGeometry, GeometryUsage, DefaultFramebuffer} from "../../lib/GL"
import {context, canvas} from "../GLContext"
import Picture from "../models/Picture"
import {Vec2, Vec4, Transform} from "../../lib/Geometry"

const shader = new TextureShader(context)

export default
class Renderer {
  model: Model
  size = new Vec2(100, 100)
  transform = Transform.identity
  transforms = {
    pictureToDOM: Transform.identity,
    pictureToGLViewport: Transform.identity,
    pictureToGLUnit: Transform.identity,
    domToPicture: Transform.identity,
  }

  constructor(public picture: Picture) {
    const geom = new RectGeometry(context, GeometryUsage.Static)
    geom.rect = Vec4.fromVec2(new Vec2(0), picture.size)
    this.model = new Model(context, geom, shader)
  }

  updateTransforms() {
    this.transforms.pictureToDOM = Transform.translate(this.picture.size.mul(-0.5))
      .merge(this.transform)
      .merge(Transform.translate(this.size.mul(0.5)))
    this.transforms.pictureToGLViewport = this.transforms.pictureToDOM
      .merge(Transform.scale(new Vec2(1, -1)))
      .merge(Transform.translate(new Vec2(0, this.size.height)))
    this.transforms.pictureToGLUnit = this.transforms.pictureToDOM
      .merge(Transform.translate(this.size.mul(-0.5)))
      .merge(Transform.scale(new Vec2(2 / this.size.width, -2 / this.size.height)))
    this.transforms.domToPicture = this.transforms.pictureToDOM.invert()
  }

  resize(size: Vec2) {
    this.size = size
    canvas.width = size.width
    canvas.height = size.height
    context.resize()
    this.updateTransforms()
    this.render()
  }

  render(rectInPicture?: Vec4) {
    this.picture.layerBlender.render(rectInPicture)
    context.defaultFramebuffer.use()
    if (rectInPicture) {
      context.setScissor(this.transforms.pictureToGLViewport.transformRect(rectInPicture))
    }
    context.setClearColor(new Vec4(0.9, 0.9, 0.9, 1))
    context.clear()
    shader.uTransform.setTransform(this.transforms.pictureToGLUnit)
    context.textureUnits.set(0, this.picture.layerBlender.blendedTexture)
    this.model.render()
    context.textureUnits.delete(0)
    context.clearScissor()
  }
}
