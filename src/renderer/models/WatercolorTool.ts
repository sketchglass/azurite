import {Vec2, Vec4, Transform, unionRect} from "../../lib/Geometry"
import Waypoint from "./Waypoint"
import Tool from "./Tool"
import {Geometry, Shader, Model, GeometryUsage, Framebuffer, Texture, BlendMode} from "../../lib/GL"
import {context} from "../GLContext"
import WatercolorSettings from "../views/WatercolorSettings"
import React = require("react")

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

enum SampleModes {
  Original, Shape, Clip
}

const sampleFragShader = `
  precision mediump float;

  uniform vec2 uLayerSize;
  uniform float uBrushRadius;
  uniform vec2 uBrushPos;
  uniform sampler2D uLayer;
  uniform int uMode;

  varying vec2 vOffset;

  vec4 fetchOriginal() {
    vec2 layerPos = floor(uBrushPos) + vOffset;
    vec2 layerUV = layerPos / uLayerSize;
    return texture2D(uLayer, layerUV);
  }

  float calcOpacity(float r) {
    return smoothstep(uBrushRadius, uBrushRadius * 0.5, r);
  }

  void main(void) {
    float r = distance(fract(uBrushPos), vOffset);
    if (r >= uBrushRadius) {
      gl_FragColor = vec4(0.0);
      return;
    }

    if (uMode == ${SampleModes.Original}) {
      gl_FragColor = fetchOriginal();
    } else if (uMode == ${SampleModes.Shape}) {
      gl_FragColor = vec4(calcOpacity(r));
    } else {
      gl_FragColor = fetchOriginal() * calcOpacity(r);
    }
  }
`

const brushVertShader = `
  precision highp float;

  uniform vec2 uLayerSize;
  uniform float uSampleSize;
  uniform vec2 uBrushPos;
  uniform float uBrushRadius;
  uniform mediump float uPressure;
  uniform mediump float uOpacity;
  uniform sampler2D uSampleShape;
  uniform sampler2D uSampleClip;

  attribute vec2 aPosition;

  varying vec4 vMixColor;
  varying vec2 vTexCoord;
  varying mediump float vOpacity;

  void main(void) {
    vTexCoord = aPosition * 0.5 + 0.5;
    vec2 layerPos = floor(uBrushPos) + aPosition * (uSampleSize * 0.5);
    vec2 normalizedPos = layerPos / uLayerSize * 2.0 - 1.0;
    gl_Position = vec4(normalizedPos, 0.0, 1.0);

    float topLevel = log2(uSampleSize);
    vMixColor = texture2DLod(uSampleClip, vec2(0.5), topLevel) / vec4(texture2DLod(uSampleShape, vec2(0.5),  topLevel).a);

    vOpacity = uOpacity * uPressure;
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
  varying float vOpacity;

  void main(void) {
    float opacity = texture2D(uSampleShape, vTexCoord).a * vOpacity;
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
  opacity = 1.0
  blending = 0.5
  thickness = 0.5
  spacingRatio = 0.1

  name = "Watercolor"

  squareGeometry = new Geometry(context, new Float32Array([
    -1, -1,
    -1, 1,
    1, -1,
    1, 1,
  ]), [
    {attribute: "aPosition", size: 2}
  ], new Uint16Array([
    0, 1, 2,
    1, 2, 3
  ]), GeometryUsage.Static)

  framebuffer = new Framebuffer(context)
  shader = new Shader(context, brushVertShader, brushFragShader)
  model = new Model(context, this.squareGeometry, this.shader)

  sampleShader = new Shader(context, sampleVertShader, sampleFragShader)
  sampleModel = new Model(context, this.squareGeometry, this.sampleShader)

  sampleOriginalTexture = new Texture(context, new Vec2(0))
  sampleOrigianlFramebuffer = new Framebuffer(context, this.sampleOriginalTexture)
  sampleShapeTexture = new Texture(context, new Vec2(0))
  sampleShapeFramebuffer = new Framebuffer(context, this.sampleShapeTexture)
  sampleClipTexture = new Texture(context, new Vec2(0))
  sampleClipFramebuffer = new Framebuffer(context, this.sampleClipTexture)

  shaders = [this.shader, this.sampleShader]

  constructor() {
    super()
    this.model.setBlendMode(BlendMode.Src)
    this.sampleModel.setBlendMode(BlendMode.Src)

    const {gl} = context
    for (const texture of [this.sampleShapeTexture, this.sampleClipTexture]) {
      gl.bindTexture(gl.TEXTURE_2D, texture.texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    }

    this.shader.setUniformInt("uSampleOriginal", 0)
    this.shader.setUniformInt("uSampleShape", 1)
    this.shader.setUniformInt("uSampleClip", 2)
    this.sampleShader.setUniformInt("uLayer", 0)
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
      shader.setUniform("uOpacity", this.opacity)
      shader.setUniform("uBrushRadius", this.width * 0.5)
    }

    this.sampleOriginalTexture.resize(new Vec2(sampleSize))
    this.sampleShapeTexture.resize(new Vec2(sampleSize))
    this.sampleClipTexture.resize(new Vec2(sampleSize))

    return new Vec4(0)
  }

  move(waypoint: Waypoint) {
    if (!this.lastWaypoint) {
      return new Vec4(0)
    }

    const getNextSpacing = (waypoint: Waypoint) => {
      return this.width * this.spacingRatio
    }

    const {waypoints, nextOffset} = Waypoint.interpolate(this.lastWaypoint, waypoint, getNextSpacing, this.nextDabOffset)
    this.lastWaypoint = waypoint
    this.nextDabOffset = nextOffset

    if (waypoints.length == 0) {
      return new Vec4(0)
    }

    for (const [i, waypoint] of waypoints.entries()) {
      for (const shader of this.shaders) {
        shader.setUniform("uBrushPos", waypoint.pos)
        shader.setUniform("uPressure", waypoint.pressure)
      }

      context.textureUnits.set(0, this.layer.texture)
      this.sampleShader.setUniformInt("uMode", SampleModes.Original)
      this.sampleOrigianlFramebuffer.use(() => {
        this.sampleModel.render()
      })
      this.sampleShader.setUniformInt("uMode", SampleModes.Shape)
      this.sampleShapeFramebuffer.use(() => {
        this.sampleModel.render()
      })
      this.sampleShader.setUniformInt("uMode", SampleModes.Clip)
      this.sampleClipFramebuffer.use(() => {
        this.sampleModel.render()
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
    const rectWidth = this.width + 2
    const rects = waypoints.map(w => new Vec4(w.pos.x - rectWidth * 0.5, w.pos.y - rectWidth * 0.5, rectWidth, rectWidth))
    return unionRect(...rects)
  }

  end() {
    return new Vec4(0)
  }

  renderSettings() {
    return React.createFactory(WatercolorSettings)({tool: this})
  }
}
