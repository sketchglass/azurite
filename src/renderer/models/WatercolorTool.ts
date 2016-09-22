import {Vec2, Vec4, Transform, unionRect} from "../../lib/Geometry"
import Waypoint from "./Waypoint"
import BaseBrushTool from "./BaseBrushTool"
import {Geometry, Shader, Model, GeometryUsage, Framebuffer, Texture, BlendMode, DataType} from "../../lib/GL"
import {context} from "../GLContext"
import TiledTexture from "./TiledTexture"
import WatercolorSettings from "../views/WatercolorSettings"
import React = require("react")

enum SampleModes {
  Shape, Clip
}

const sampleVertShader = `
  precision highp float;

  uniform float uSampleSize;
  uniform float uPressure;
  uniform float uMinWidthRatio;
  uniform float uBrushRadius;
  uniform lowp int uMode;
  attribute vec2 aPosition;
  varying vec2 vOffset;
  varying vec2 vTexCoord;
  varying float vRadius;

  void main(void) {
    vRadius = uBrushRadius * (uMinWidthRatio + (1.0 - uMinWidthRatio) * uPressure);
    vOffset = aPosition * (uSampleSize * 0.5);
    vTexCoord = aPosition * 0.5 + 0.5;
    if (uMode == ${SampleModes.Shape}) {
      // draw in left
      gl_Position = vec4(aPosition.x * 0.5 - 0.5, aPosition.y, 0.0, 1.0);
    } else {
      // draw in right
      gl_Position = vec4(aPosition.x * 0.5 + 0.5, aPosition.y, 0.0, 1.0);
    }
  }
`

const sampleFragShader = `
  precision mediump float;

  uniform highp vec2 uBrushPos;
  uniform float uSoftness;
  uniform sampler2D uOriginal;
  uniform lowp int uMode;

  varying highp vec2 vOffset;
  varying highp vec2 vTexCoord;
  varying highp float vRadius;

  vec4 fetchOriginal() {
    return texture2D(uOriginal, vTexCoord);
  }

  float calcOpacity(float r) {
    return smoothstep(vRadius, vRadius - max(1.0, vRadius * uSoftness), r);
  }

  void main(void) {
    float r = distance(fract(uBrushPos), vOffset);

    if (uMode == ${SampleModes.Shape}) {
      gl_FragColor = vec4(calcOpacity(r));
    } else {
      gl_FragColor = fetchOriginal() * calcOpacity(r);
    }
  }
`

const brushVertShader = `
  precision highp float;

  uniform float uSampleSize;
  uniform vec2 uBrushPos;
  uniform float uBrushRadius;
  uniform vec2 uTileKey;
  uniform mediump float uPressure;
  uniform mediump float uOpacity;
  uniform sampler2D uSampleShape;

  attribute vec2 aPosition;

  varying vec4 vMixColor;
  varying vec2 vTexCoord;
  varying mediump float vOpacity;

  vec4 calcMixColor() {
    float topLod = log2(uSampleSize);
    vec4 sampleAverage = texture2DLod(uSampleShape, vec2(0.75, 0.5), topLod);
    vec4 shapeAverage = texture2DLod(uSampleShape, vec2(0.25, 0.5),  topLod);
    return sampleAverage / shapeAverage.a;
  }

  void main(void) {
    vTexCoord = aPosition * 0.5 + 0.5;
    vec2 layerPos = floor(uBrushPos) + aPosition * (uSampleSize * 0.5);
    vec2 tilePos = layerPos - uTileKey * ${TiledTexture.tileSize}.0;
    vec2 glPos = tilePos / ${TiledTexture.tileSize}.0 * 2.0 - 1.0;
    gl_Position = vec4(glPos, 0.0, 1.0);
    vMixColor = calcMixColor();
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
    float opacity = texture2D(uSampleShape, vTexCoord * vec2(0.5, 1.0)).a * vOpacity;
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
class WatercolorTool extends BaseBrushTool {
  minWidthRatio = 1
  blending = 0.5
  thickness = 0.5

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

  shader = new Shader(context, brushVertShader, brushFragShader)
  model = new Model(context, this.squareGeometry, this.shader)
  framebuffer = new Framebuffer(context)

  sampleShader = new Shader(context, sampleVertShader, sampleFragShader)
  sampleModel = new Model(context, this.squareGeometry, this.sampleShader)

  sampleOriginalTexture = new Texture(context, new Vec2(0), DataType.HalfFloat)
  sampleShapeTexture = new Texture(context, new Vec2(0), DataType.HalfFloat)
  sampleShapeFramebuffer = new Framebuffer(context, this.sampleShapeTexture)

  shaders = [this.shader, this.sampleShader]

  sampleSize = 0

  constructor() {
    super()
    this.model.setBlendMode(BlendMode.Src)
    this.sampleModel.setBlendMode(BlendMode.Src)

    const {gl} = context
    gl.bindTexture(gl.TEXTURE_2D, this.sampleShapeTexture.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST)

    this.shader.uniform("uSampleOriginal").setInt(0)
    this.shader.uniform("uSampleShape").setInt(1)
    this.shader.uniform("uSampleClip").setInt(2)
    this.sampleShader.uniform("uLayer").setInt(0)
  }

  start(waypoint: Waypoint) {
    const layerSize = this.picture.currentLayer.size
    this.sampleSize = Math.pow(2, Math.ceil(Math.log2(this.width + 2)))

    for (const shader of this.shaders) {
      shader.uniform('uLayerSize').setVec2(layerSize)
      shader.uniform("uSampleSize").setFloat(this.sampleSize)
      shader.uniform('uBlending').setFloat(this.blending)
      shader.uniform('uThickness').setFloat(this.thickness)
      shader.uniform('uColor').setVec4(this.color)
      shader.uniform("uOpacity").setFloat(this.opacity)
      shader.uniform("uBrushRadius").setFloat(this.width * 0.5)
      shader.uniform("uSoftness").setFloat(this.softness)
      shader.uniform("uMinWidthRatio").setFloat(this.minWidthRatio)
    }

    this.sampleOriginalTexture.reallocate(new Vec2(this.sampleSize))
    this.sampleShapeTexture.reallocate(new Vec2(this.sampleSize * 2, this.sampleSize))

    return super.start(waypoint)
  }

  renderWaypoints(waypoints: Waypoint[], rect: Vec4) {
    const uMode = this.sampleShader.uniform("uMode")
    const uBrushPos = this.shader.uniform("uBrushPos")
    const uPressure = this.shader.uniform("uPressure")
    const uTileKey = this.shader.uniform("uTileKey")
    const uBrushPosSample = this.sampleShader.uniform("uBrushPos")
    const uPressureSample = this.sampleShader.uniform("uPressure")
    const {tiledTexture} = this.picture.currentLayer

    for (let i = 0; i < waypoints.length; ++i) {
      const waypoint = waypoints[i]
      uBrushPosSample.setVec2(waypoint.pos)
      uPressureSample.setFloat(waypoint.pressure)
      const topLeft = waypoint.pos.floor().sub(new Vec2(this.sampleSize / 2))

      tiledTexture.readToTexture(this.sampleOriginalTexture, topLeft)

      context.textureUnits.set(0, this.sampleOriginalTexture)

      this.sampleShapeFramebuffer.use()
      uMode.setInt(SampleModes.Shape)
      this.sampleModel.render()
      uMode.setInt(SampleModes.Clip)
      this.sampleModel.render()

      this.sampleShapeTexture.generateMipmap()

      context.textureUnits.set(0, this.sampleOriginalTexture)
      context.textureUnits.set(1, this.sampleShapeTexture)
      uBrushPos.setVec2(waypoint.pos)
      uPressure.setFloat(waypoint.pressure)

      this.framebuffer.use()
      for (const key of TiledTexture.keysForRect(rect)) {
        uTileKey.setVec2(key)
        this.framebuffer.setTexture(tiledTexture.get(key))
        this.model.render()
      }

      context.textureUnits.delete(0)
      context.textureUnits.delete(1)
    }
  }

  renderSettings() {
    return React.createFactory(WatercolorSettings)({tool: this})
  }
}
