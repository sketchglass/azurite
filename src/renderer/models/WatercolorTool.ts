import {Vec2, Vec4, Transform} from "../../lib/Geometry"
import Waypoint from "./Waypoint"
import Tool from "./Tool"
import {Geometry, Shader, Model, GeometryUsage, Framebuffer, Texture, BlendMode} from "../../lib/GL"
import {context} from "../GLContext"

const sampleVertShader = `
  precision highp float;

  uniform mediump float uSampleSize;
  attribute vec2 aPosition;
  attribute vec2 aCenter;
  varying mediump vec2 vOffset;
  varying mediump vec2 vCenter;

  void main(void) {
    vCenter = aCenter;
    vOffset = aPosition * (uSampleSize * 0.5);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

const sampleFragShader = `
  #extension GL_EXT_draw_buffers : require
  precision mediump float;

  uniform vec2 uLayerSize;
  uniform float uBrushRadius;
  uniform sampler2D uLayer;

  varying vec2 vOffset;
  varying vec2 vCenter;

  void main(void) {
    float r = distance(fract(vCenter), vOffset);
    if (uBrushRadius <= r) {
      gl_FragData[0] = vec4(0.0);
      gl_FragData[1] = vec4(0.0);
      gl_FragData[2] = vec4(0.0);
      return;
    }
    float opacity = smoothstep(uBrushRadius, uBrushRadius - 1.0, r);

    vec2 layerPos = floor(vCenter) + vOffset;
    vec2 layerUV = layerPos / uLayerSize;
    vec4 orig = texture2D(uLayer, layerUV);

    gl_FragData[0] = orig; // copy of orignal
    gl_FragData[1] = vec4(opacity); // brush shape
    gl_FragData[2] = orig * opacity; // original clipped by brush shape
  }
`

const brushVertShader = `
  precision highp float;

  uniform vec2 uLayerSize;
  uniform float uSampleSize;
  attribute vec2 aPosition;
  attribute vec2 aCenter;

  uniform sampler2D uSampleShape;
  uniform sampler2D uSampleClip;

  varying vec4 vMixColor;
  varying vec2 vTexCoord;

  void main(void) {
    vTexCoord = aPosition * 0.5 + 0.5;
    vec2 layerPos = floor(aCenter) + aPosition * (uSampleSize * 0.5);
    vec2 normalizedPos = layerPos / uLayerSize * 2.0 - 1.0;
    gl_Position = vec4(normalizedPos, 0.0, 1.0);

    float topLevel = log2(uSampleSize);
    vMixColor = texture2DLod(uSampleClip, vec2(0.5), topLevel) / vec4(texture2DLod(uSampleShape, vec2(0.5),  topLevel).a);
  }
`

const brushFragShader = `
  precision mediump float;

  uniform float uBlending;
  uniform float uThickness;
  uniform vec4 uColor;

  uniform sampler2D uSampleOriginal;
  uniform sampler2D uSampleShape;

  varying vec4 vMixColor;
  varying vec2 vTexCoord;

  void main(void) {
    float opacity = texture2D(uSampleShape, vTexCoord).a;
    if (opacity == 0.0) {
      discard;
    }
    vec4 orig = texture2D(uSampleOriginal, vTexCoord);

    float mixRate = opacity * uBlending;
    // mix color
    vec4 color = orig * (1.0 - mixRate) + vMixColor * mixRate;
    // add color
    vec4 addColor = uColor * (uThickness * opacity);

    gl_FragColor = addColor + color * (1.0 - addColor.a);
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
    {attribute: "aCenter", size: 2},
    {attribute: "aPressure", size: 1},
  ], GeometryUsage.Static)

  framebuffer = new Framebuffer(context)
  shader = new Shader(context, brushVertShader, brushFragShader)
  model = new Model(context, this.dabsGeometry, this.shader)

  sampleSize = 0
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

    const {gl} = context
    for (const texture of [this.sampleShapeTexture, this.sampleClipTexture]) {
      gl.bindTexture(gl.TEXTURE_2D, texture.texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    }
  }

  start(waypoint: Waypoint) {
    this.lastWaypoint = waypoint
    this.nextDabOffset = 0

    this.framebuffer.size = this.layer.size
    this.framebuffer.setTexture(this.layer.texture)

    const layerSize = this.layer.size
    const sampleSize = this.sampleSize = Math.pow(2, Math.ceil(Math.log2(this.width + 2)))
    this.shader.setUniform('uLayerSize', layerSize)
    this.shader.setUniform("uSampleSize", sampleSize)
    this.shader.setUniform('uBlending', this.blending)
    this.shader.setUniform('uThickness', this.thickness)
    this.shader.setUniform('uColor', this.color)
    this.shader.setUniformInt("uSampleOriginal", 0)
    this.shader.setUniformInt("uSampleShape", 1)
    this.shader.setUniformInt("uSampleClip", 2)

    this.sampleShader.setUniform("uLayerSize", layerSize)
    this.sampleShader.setUniform("uSampleSize", sampleSize)
    this.sampleShader.setUniform("uBrushRadius", this.width * 0.5)
    this.sampleShader.setUniformInt("uLayer", 0)

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

      const geomData = new Float32Array(waypoints.length * 20)
      for (const [i, {pos, pressure}] of waypoints.entries()) {
        const positions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        for (const [j, [x, y]] of positions.entries()) {
          geomData.set([x, y, pos.x, pos.y, pressure], i * 20 + j * 5)
        }
      }
      this.dabsGeometry.data = geomData
      this.dabsGeometry.updateBuffer()

      for (let [i, waypoint] of waypoints.entries()) {
        context.textureUnits.set(0, this.layer.texture)
        this.sampleFramebuffer.use(() => {
          this.sampleModel.render(i * 4, 4)
        })

        this.sampleShapeTexture.generateMipmap()
        this.sampleClipTexture.generateMipmap()

        context.textureUnits.set(0, this.sampleOriginalTexture)
        context.textureUnits.set(1, this.sampleShapeTexture)
        context.textureUnits.set(2, this.sampleClipTexture)

        this.framebuffer.use(() => {
          this.model.render(i * 4, 4)
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
