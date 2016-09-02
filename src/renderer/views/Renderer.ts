import {Shader, Model, Geometry, GeometryUsage, DefaultFramebuffer} from "../../lib/GL"
import {context, canvas} from "../GLContext"
import Picture from "../models/Picture"
import {Vec2, Vec4, Transform} from "../../lib/Geometry"

const rendererVertShader = `
  precision mediump float;

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
const backgroundFragShader = `
  precision lowp float;
  varying mediump vec2 vUVPosition;
  void main(void) {
    gl_FragColor = vec4(1.0);
  }
`

const layerFragShader = `
  precision lowp float;
  varying mediump vec2 vUVPosition;
  uniform sampler2D uTexture;
  void main(void) {
    gl_FragColor = texture2D(uTexture, vUVPosition);
  }
`

export default
class Renderer {
  layerShader: Shader
  layerModel: Model
  backgroundShader: Shader
  backgroundModel: Model
  size = new Vec2(100, 100)
  transform = Transform.identity
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
    this.layerShader = new Shader(context, rendererVertShader, layerFragShader)
    this.layerModel = new Model(context, geom, this.layerShader)
    context.setClearColor(new Vec4(0.9, 0.9, 0.9, 1))
    this.backgroundShader = new Shader(context, rendererVertShader, backgroundFragShader)
    this.backgroundModel = new Model(context, geom, this.backgroundShader)
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
    new DefaultFramebuffer(context).use(() => {
      if (rectInPicture) {
        context.setScissor(this.transforms.pictureToGLViewport.transformRect(rectInPicture))
      }
      context.clear()
      this.backgroundShader.setUniform("uTransform", this.transforms.pictureToGLUnit)
      this.backgroundModel.render()
      this.layerShader.setUniform("uTransform", this.transforms.pictureToGLUnit)
      this.layerShader.setUniformInt("uTexture", 0)
      for (const layer of this.picture.layers) {
        context.textureUnits.set(0, layer.texture)
        this.layerModel.render()
      }
      context.textureUnits.delete(0)
      context.clearScissor()
    })
  }
}
