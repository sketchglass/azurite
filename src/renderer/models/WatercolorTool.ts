import {Vec2, Vec4, Transform} from "../../lib/Geometry"
import Waypoint from "./Waypoint"
import Tool from "./Tool"
import {Geometry, Shader, Model, GeometryUsage, Framebuffer, Texture, BlendMode} from "../../lib/GL"
import {context} from "../GLContext"

const sampleVertShader = `
  precision mediump float;

  uniform float uSampleSize;

  attribute vec2 aPosition;
  attribute float aPressure;

  varying vec2 vCenter;

  void main(void) {
    vCenter = floor(aPosition - vec2(0.5)) + vec2(0.5);
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    gl_PointSize = uSampleSize;
  }
`

const sampleFragShader = `
  #extension GL_EXT_draw_buffers : require
  precision mediump float;

  uniform float uSampleSize;
  uniform vec2 uLayerSize;
  uniform float uBrushSize;

  uniform sampler2D uLayer;

  varying vec2 vCenter;

  void main(void) {
    vec2 pointPos = (gl_PointCoord - vec2(0.5)) * vec2(uSampleSize);
    float r = length(pointPos);
    float radius = uBrushSize * 0.5;
    lowp float opacity = smoothstep(radius, radius - 1.0, r);

    vec2 layerPos = pointPos + vCenter;
    lowp vec4 orig = texture2D(uLayer, layerPos / uLayerSize);

    gl_FragData[0] = orig; // copy of orignal
    gl_FragData[1] = vec4(opacity); // brush shape
    gl_FragData[2] = orig * vec4(opacity); // original clipped by brush shape
  }
`

const brushVertShader = `
  precision mediump float;

  uniform mat3 uTransform;
  uniform float uSampleSize;
  attribute vec2 aPosition;
  attribute float aPressure;

  uniform sampler2D uSampleShape;
  uniform sampler2D uSampleClip;

  varying lowp vec4 vMixColor;

  void main(void) {
    vec2 center = floor(aPosition - vec2(0.5)) + vec2(0.5);
    vec3 pos = uTransform * vec3(center, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);
    gl_PointSize = uSampleSize;

    float topLevel = log2(uSampleSize);
    vMixColor = texture2DLod(uSampleClip, vec2(0.0), topLevel) / vec4(texture2DLod(uSampleShape, vec2(0.0),  topLevel).a);
  }
`

const brushFragShader = `
  precision lowp float;

  uniform lowp float uBlending;
  uniform lowp float uThickness;
  uniform lowp vec4 uColor;

  uniform sampler2D uSampleOriginal;
  uniform sampler2D uSampleShape;

  varying lowp vec4 vMixColor;

  void main(void) {
    vec4 orig = texture2D(uSampleOriginal, gl_PointCoord);
    float brushOpacity = texture2D(uSampleShape, gl_PointCoord).a;

    float mixRate = brushOpacity * uBlending;
    // mix color
    vec4 color = orig * vec4(1.0 - mixRate) + vMixColor * vec4(mixRate);
    // add color
    vec4 addColor = uColor * vec4(uThickness * brushOpacity);
    gl_FragColor = addColor + color * vec4(1.0 - addColor.a);
  }
`

export default
class WatercolorTool extends Tool {
  private lastWaypoint: Waypoint|undefined
  private nextDabOffset = 0

  width = 10
  color = new Vec4(0, 0, 0, 1)
  blending = 0.5
  thickness = 0.5

  dabsGeometry = new Geometry(context, new Float32Array(0), [
    {attribute: "aPosition", size: 2},
    {attribute: "aPressure", size: 1},
  ], GeometryUsage.Stream)
  framebuffer = new Framebuffer(context)
  shader = new Shader(context, brushVertShader, brushFragShader)
  model = new Model(context, this.dabsGeometry, this.shader)

  sampleShader = new Shader(context, sampleVertShader, sampleFragShader)
  sampleModel = new Model(context, this.dabsGeometry, this.sampleShader)
  sampleFramebuffer = new Framebuffer(context)
  sampleOriginalTexture = new Texture(context, new Vec2(0))
  sampleShapeTexture = new Texture(context, new Vec2(0))
  sampleClipTexture = new Texture(context, new Vec2(0))

  constructor() {
    super()
    this.model.setBlendMode(BlendMode.Src)
    this.sampleModel.setBlendMode(BlendMode.Src)
  }

  start(waypoint: Waypoint) {
    this.lastWaypoint = waypoint
    this.nextDabOffset = 0

    this.framebuffer.size = this.layer.size
    this.framebuffer.setTexture(this.layer.texture)

    const layerSize = this.layer.size
    const transform =
      Transform.scale(new Vec2(2 / layerSize.width, -2 / layerSize.height))
        .merge(Transform.translate(new Vec2(-1, 1)))
    const sampleSize = Math.pow(2, Math.ceil(Math.log2(this.width + 2)))
    this.shader.setUniform('uTransform', transform)
    this.shader.setUniform("uSampleSize", sampleSize)
    this.shader.setUniform('uBlending', this.blending)
    this.shader.setUniform('uThickness', this.thickness)
    this.shader.setUniform('uColor', this.color)

    this.sampleShader.setUniform("uLayerSize", layerSize)
    this.sampleShader.setUniform("uSampleSize", sampleSize)
    this.sampleShader.setUniform("uBrushSize", this.width)

    this.sampleOriginalTexture.resize(new Vec2(sampleSize))
    this.sampleShapeTexture.resize(new Vec2(sampleSize))
    this.sampleClipTexture.resize(new Vec2(sampleSize))

    this.sampleFramebuffer.setTextures([this.sampleOriginalTexture, this.sampleShapeTexture, this.sampleClipTexture])
  }

  move(waypoint: Waypoint) {
    if (this.lastWaypoint) {
      const {waypoints, nextOffset} = Waypoint.interpolate(this.lastWaypoint, waypoint, this.nextDabOffset)
      this.lastWaypoint = waypoint
      this.nextDabOffset = nextOffset

      if (waypoints.length == 0) {
        return
      }

      const vertices = new Float32Array(waypoints.length * 3)
      for (const [i, {pos, pressure}] of waypoints.entries()) {
        vertices.set([pos.x, pos.y, pressure], i * 3)
      }

      this.dabsGeometry.data = vertices
      this.dabsGeometry.updateBuffer()

      for (let i = 0; i < waypoints.length; ++i) {
        context.textureUnits.set(0, this.layer.texture)
        this.sampleShader.setUniformInt("uLayer", 0)
        this.sampleFramebuffer.use(() => {
          this.sampleModel.renderPoints(i, 1)
        })

        this.sampleShapeTexture.generateMipmap()
        this.sampleClipTexture.generateMipmap()

        context.textureUnits.set(0, this.sampleOriginalTexture)
        context.textureUnits.set(1, this.sampleShapeTexture)
        context.textureUnits.set(2, this.sampleClipTexture)
        this.shader.setUniformInt("uSampleOriginal", 0)
        this.shader.setUniformInt("uSampleShape", 1)
        this.shader.setUniformInt("uSampleClip", 2)
        this.framebuffer.use(() => {
          this.model.renderPoints(i, 1)
        })
        context.textureUnits.delete(0)
        context.textureUnits.delete(1)
        context.textureUnits.delete(2)
      }
    }
  }

  end() {
  }
}
