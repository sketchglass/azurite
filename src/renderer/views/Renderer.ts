import {Shader, Model, Geometry, GeometryUsage, DefaultFramebuffer} from "../../lib/GL"
import {context, canvas} from "../GLContext"
import Picture from "../models/Picture"
import {Vec2, Vec4, Transform} from "../../lib/Geometry"
import Navigation from "../models/Navigation"

const vert = `
  precision highp float;

  uniform mat3 uTransform;
  attribute vec2 aPosition;
  attribute vec2 aUVPosition;
  varying vec2 vUVPosition;

  void main(void) {
    vUVPosition = aUVPosition;
    vec3 pos = uTransform * vec3(aPosition, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);
  }
`

const frag = `
  precision mediump float;
  varying highp vec2 vUVPosition;
  uniform sampler2D uTexture;
  void main(void) {
    gl_FragColor = texture2D(uTexture, vUVPosition);
  }
`

const shader = new Shader(context, vert, frag)
shader.uniform("uTexture").setInt(0)

export default
class Renderer {
  model: Model
  size = new Vec2(100, 100)

  transforms = {
    pictureToRenderer: Transform.identity,
    pictureToGLViewport: Transform.identity,
    pictureToGLUnit: Transform.identity,
    rendererToPicture: Transform.identity,
  }

  constructor(public picture: Picture) {
    const {width, height} = picture.size
    const vertices = new Float32Array([
      0, 0, 0, 0,
      width, 0, 1, 0,
      0, height, 0, 1,
      width, height, 1, 1
    ])
    const indices = new Uint16Array([
      0, 1, 2,
      1, 2, 3
    ])
    const geom = new Geometry(context, vertices, [
      {attribute: "aPosition", size: 2},
      {attribute: "aUVPosition", size: 2},
    ], indices, GeometryUsage.Static)
    this.model = new Model(context, geom, shader)
    this.picture.changed.forEach(() => this.render())
  }

  updateTransforms() {
    const {navigation} = this.picture
    const pictureCenter = this.picture.size.mul(0.5).round()
    const viewportCenter = this.size.mul(0.5).round()
    const transform = Transform.translate(navigation.translation)
      .merge(Transform.scale(new Vec2(navigation.scale)))
      .merge(Transform.rotate(navigation.rotation))
    this.transforms.pictureToRenderer = Transform.translate(pictureCenter.neg())
      .merge(transform)
      .merge(Transform.translate(viewportCenter))
    this.transforms.pictureToGLViewport = this.transforms.pictureToRenderer
      .merge(Transform.scale(new Vec2(1, -1)))
      .merge(Transform.translate(new Vec2(0, this.size.height)))
    this.transforms.pictureToGLUnit = this.transforms.pictureToRenderer
      .merge(Transform.translate(viewportCenter.neg()))
      .merge(Transform.scale(new Vec2(2 / this.size.width, -2 / this.size.height)))
    this.transforms.rendererToPicture = this.transforms.pictureToRenderer.invert()
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
    this.updateTransforms()
    context.defaultFramebuffer.use()
    if (rectInPicture) {
      context.setScissor(this.transforms.pictureToGLViewport.transformRect(rectInPicture))
    }
    context.setClearColor(new Vec4(240/255, 240/255, 240/255, 1))
    context.clear()
    shader.uniform("uTransform").setTransform(this.transforms.pictureToGLUnit)
    context.textureUnits.set(0, this.picture.layerBlender.blendedTexture)
    this.model.render()
    context.textureUnits.delete(0)
    context.clearScissor()
  }
}
