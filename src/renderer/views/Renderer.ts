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
  rendererToPicture = Transform.identity

  constructor(public picture: Picture) {
    const {width, height} = picture.size
    const vertices = new Float32Array([
      -width * 0.5, -height * 0.5, 0, 0,
      width * 0.5, -height * 0.5, 1, 0,
      -width * 0.5, height * 0.5, 0, 1,
      width * 0.5, height * 0.5, 1, 1
    ])
    const geom = new Geometry(context, vertices, [
      {attribute: "aPosition", size: 2},
      {attribute: "aUVPosition", size: 2},
    ], GeometryUsage.Static)
    this.layerShader = new Shader(context, rendererVertShader, layerFragShader)
    this.layerModel = new Model(context, geom, this.layerShader)
    context.setClearColor(new Vec4(0.9, 0.9, 0.9, 1))
    this.backgroundShader = new Shader(context, rendererVertShader, backgroundFragShader)
    this.backgroundModel = new Model(context, geom, this.backgroundShader)
  }

  resize(size: Vec2) {
    this.rendererToPicture = Transform.translate(
      size.sub(this.picture.size).mul(-0.5)
    )
    this.size = size
    canvas.width = size.width
    canvas.height = size.height
    context.resize()
    this.render()
  }

  render() {
    new DefaultFramebuffer(context).use(() => {
      context.clear()
      const sceneToUnit = Transform.scale(new Vec2(2 / canvas.width, -2 / canvas.height)) // invert y
      const transform = this.transform.merge(sceneToUnit)
      this.backgroundShader.setUniform("uTransform", transform)
      this.backgroundModel.render()
      this.layerShader.setUniform("uTransform", transform)
      this.layerShader.setUniformInt("uTexture", 0)
      for (const layer of this.picture.layers) {
        context.textureUnits.set(0, layer.texture)
        this.layerModel.render()
      }
      context.textureUnits.delete(0)
    })
  }
}
