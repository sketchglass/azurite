import {Vec2, Vec4, Transform} from "../../lib/Geometry"
import Waypoint from "./Waypoint"
import Tool from "./Tool"
import {Geometry, Shader, Model, GeometryUsage, Framebuffer, Texture, BlendMode} from "../../lib/GL"
import {context} from "../GLContext"

const sampleVertShader = `
  precision highp float;

  uniform mediump float uSampleSize;
  attribute vec2 aPosition;
  varying mediump vec2 vOffset;
  varying mediump vec2 vTexCoord;

  void main(void) {
    vOffset = aPosition * (uSampleSize * 0.5);
    vTexCoord = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

const sampleOriginalFragShader = `
  precision mediump float;

  uniform vec2 uLayerSize;
  uniform float uBrushRadius;
  uniform vec2 uBrushPos;
  uniform sampler2D uLayer;

  varying vec2 vOffset;

  void main(void) {
    vec2 layerPos = floor(uBrushPos) + vOffset;
    vec2 layerUV = layerPos / uLayerSize;

    gl_FragColor = texture2D(uLayer, layerUV);
  }
`

const sampleShapeFragShader = `
  precision mediump float;

  uniform vec2 uLayerSize;
  uniform float uBrushRadius;
  uniform vec2 uBrushPos;
  uniform sampler2D uLayer;

  varying vec2 vOffset;

  void main(void) {
    float r = distance(fract(uBrushPos), vOffset);
    float opacity = smoothstep(uBrushRadius, uBrushRadius - 1.0, r);
    gl_FragColor = vec4(opacity);
  }
`

const sampleClipFragShader = `
  precision mediump float;

  varying vec2 vTexCoord;

  uniform sampler2D uSampleOriginal;
  uniform sampler2D uSampleShape;

  void main(void) {
    gl_FragColor = texture2D(uSampleOriginal, vTexCoord) * texture2D(uSampleShape, vTexCoord).a;
  }
`

const brushVertShader = `
  precision highp float;

  uniform vec2 uLayerSize;
  uniform float uSampleSize;
  uniform vec2 uBrushPos;
  attribute vec2 aPosition;

  uniform sampler2D uSampleShape;
  uniform sampler2D uSampleClip;

  varying vec4 vMixColor;
  varying vec2 vTexCoord;

  void main(void) {
    vTexCoord = aPosition * 0.5 + 0.5;
    vec2 layerPos = floor(uBrushPos) + aPosition * (uSampleSize * 0.5);
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

  squareGeometry = new Geometry(context, new Float32Array([
    -1, -1,
    -1, 1,
    1, -1,
    1, 1,
  ]), [
    {attribute: "aPosition", size: 2}
  ], GeometryUsage.Static)

  framebuffer = new Framebuffer(context)
  shader = new Shader(context, brushVertShader, brushFragShader)
  model = new Model(context, this.squareGeometry, this.shader)

  sampleOriginalShader = new Shader(context, sampleVertShader, sampleOriginalFragShader)
  sampleOriginalModel = new Model(context, this.squareGeometry, this.sampleOriginalShader)
  sampleOriginalTexture = new Texture(context, new Vec2(0))
  sampleOrigianlFramebuffer = new Framebuffer(context, this.sampleOriginalTexture)

  sampleShapeShader = new Shader(context, sampleVertShader, sampleShapeFragShader)
  sampleShapeModel = new Model(context, this.squareGeometry, this.sampleShapeShader)
  sampleShapeTexture = new Texture(context, new Vec2(0))
  sampleShapeFramebuffer = new Framebuffer(context, this.sampleShapeTexture)

  sampleClipShader = new Shader(context, sampleVertShader, sampleClipFragShader)
  sampleClipModel = new Model(context, this.squareGeometry, this.sampleClipShader)
  sampleClipTexture = new Texture(context, new Vec2(0))
  sampleClipFramebuffer = new Framebuffer(context, this.sampleClipTexture)

  shaders = [this.shader, this.sampleOriginalShader, this.sampleShapeShader, this.sampleClipShader]


  constructor() {
    super()
    this.model.setBlendMode(BlendMode.Src)
    this.sampleOriginalModel.setBlendMode(BlendMode.Src)
    this.sampleShapeModel.setBlendMode(BlendMode.Src)
    this.sampleClipModel.setBlendMode(BlendMode.Src)

    const {gl} = context
    for (const texture of [this.sampleShapeTexture, this.sampleClipTexture]) {
      gl.bindTexture(gl.TEXTURE_2D, texture.texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    }

    this.shader.setUniformInt("uSampleOriginal", 0)
    this.shader.setUniformInt("uSampleShape", 1)
    this.shader.setUniformInt("uSampleClip", 2)
    this.sampleOriginalShader.setUniformInt("uLayer", 0)
    this.sampleClipShader.setUniformInt("uSampleOriginal", 0)
    this.sampleClipShader.setUniformInt("uSampleShape", 1)
  }

  start(waypoint: Waypoint) {
    this.lastWaypoint = waypoint
    this.nextDabOffset = 0

    this.framebuffer.setTexture(this.layer.texture)

    const layerSize = this.layer.size
    const sampleSize = Math.pow(2, Math.ceil(Math.log2(this.width + 2)))

    for (const shader of this.shaders) {
      shader.setUniform('uLayerSize', layerSize)
      shader.setUniform("uSampleSize", sampleSize)
      shader.setUniform('uBlending', this.blending)
      shader.setUniform('uThickness', this.thickness)
      shader.setUniform('uColor', this.color)
      shader.setUniform("uBrushRadius", this.width * 0.5)
    }

    this.sampleOriginalTexture.resize(new Vec2(sampleSize))
    this.sampleShapeTexture.resize(new Vec2(sampleSize))
    this.sampleClipTexture.resize(new Vec2(sampleSize))
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

      for (let i = 0; i < waypoints.length; ++i) {
        for (const shader of this.shaders) {
          shader.setUniform("uBrushPos", waypoints[i].pos)
        }

        context.textureUnits.set(0, this.layer.texture)
        this.sampleOrigianlFramebuffer.use(() => {
          this.sampleOriginalModel.render()
        })
        this.sampleShapeFramebuffer.use(() => {
          this.sampleShapeModel.render()
        })
        context.textureUnits.set(0, this.sampleOriginalTexture)
        context.textureUnits.set(1, this.sampleShapeTexture)
        this.sampleClipFramebuffer.use(() => {
          this.sampleClipModel.render()
        })

        this.sampleShapeTexture.generateMipmap()
        this.sampleClipTexture.generateMipmap()

        context.textureUnits.set(0, this.sampleOriginalTexture)
        context.textureUnits.set(1, this.sampleShapeTexture)
        context.textureUnits.set(2, this.sampleClipTexture)
        this.framebuffer.use(() => {
          this.model.render()
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
