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
  _navigation = {
    translation: new Vec2(0),
    scale: 1,
    rotation: 0,
  }

  get navigation() {
    return this._navigation
  }
  set navigation(nav: Navigation) {
    this._navigation = nav
    this.updateTransforms()
  }

  transforms = {
    pictureToDOM: Transform.identity,
    pictureToGLViewport: Transform.identity,
    pictureToGLUnit: Transform.identity,
    domToPicture: Transform.identity,
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
  }

  updateTransforms() {
    const transform = Transform.scale(new Vec2(this.navigation.scale))
      .merge(Transform.rotate(this.navigation.rotation))
      .merge(Transform.translate(this.navigation.translation))
    this.transforms.pictureToDOM = Transform.translate(this.picture.size.mul(-0.5))
      .merge(transform)
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
    context.defaultFramebuffer.use()
    if (rectInPicture) {
      context.setScissor(this.transforms.pictureToGLViewport.transformRect(rectInPicture))
    }
    context.setClearColor(new Vec4(0.9, 0.9, 0.9, 1))
    context.clear()
    shader.uniform("uTransform").setTransform(this.transforms.pictureToGLUnit)
    context.textureUnits.set(0, this.picture.layerBlender.blendedTexture)
    this.model.render()
    context.textureUnits.delete(0)
    context.clearScissor()
  }
}
