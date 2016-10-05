import {Vec2, Vec4, Transform, unionRect} from "../../lib/Geometry"
import Waypoint from "./Waypoint"
import BaseBrushTool from "./BaseBrushTool";
import {Geometry, Shader, Model, GeometryUsage, Framebuffer, BlendMode} from "../../lib/GL"
import {context} from "../GLContext"
import BrushSettings from "../views/BrushSettings"
import TiledTexture from "./TiledTexture"
import React = require("react")

const brushVertShader = `
  precision mediump float;

  uniform float uBrushSize;
  uniform float uSpacingRatio;
  uniform float uMinWidthRatio;
  uniform vec2 uTileKey;
  uniform float uOpacity;

  attribute vec2 aCenter;
  attribute vec2 aOffset;
  attribute float aPressure;

  varying float vRadius;
  varying lowp float vOpacity;
  varying vec2 vOffset;

  void main(void) {
    vOffset = aOffset;
    vec2 pos = aOffset * (uBrushSize + 2.0) + aCenter;
    vec2 posTile = pos - uTileKey * ${TiledTexture.tileSize}.0;
    vec2 glPos = posTile / ${TiledTexture.tileSize}.0 * 2.0 - 1.0;
    gl_Position = vec4(glPos, 0.0, 1.0);

    float brushSize = uBrushSize * (uMinWidthRatio + (1.0 - uMinWidthRatio) * aPressure);
    float radius = brushSize * 0.5;
    vRadius = radius;
    // transparency = (overlap count) √ (final transparency)
    float spacing = max(brushSize * uSpacingRatio, 1.0);
    vOpacity = 1.0 - pow(1.0 - min(uOpacity, 0.998), spacing / brushSize);
  }
`

const brushFragShader = `
  precision mediump float;

  uniform float uBrushSize;
  uniform float uSoftness;
  uniform lowp vec4 uColor;

  varying float vRadius;
  varying lowp float vOpacity;
  varying vec2 vOffset;

  void main(void) {
    float r = length(vOffset) * (uBrushSize + 2.0);
    lowp float opacity = smoothstep(vRadius, vRadius - max(1.0, vRadius * uSoftness), r);
    gl_FragColor = uColor * opacity * vOpacity;
  }
`

export default
class BrushTool extends BaseBrushTool {
  dabsGeometry = new Geometry(context, new Float32Array(0), [
    {attribute: "aOffset", size: 2},
    {attribute: "aCenter", size: 2},
    {attribute: "aPressure", size: 1},
  ], new Uint16Array(0), GeometryUsage.Stream)
  shader = new Shader(context, brushVertShader, brushFragShader)
  model = new Model(context, this.dabsGeometry, this.shader)
  framebuffer = new Framebuffer(context)
  name = "Brush"
  eraser = false

  start(waypoint: Waypoint) {
    const layerSize = this.picture.currentLayer.size
    this.shader.uniform('uBrushSize').setFloat(this.width)
    this.shader.uniform('uColor').setVec4(this.color)
    this.shader.uniform('uOpacity').setFloat(this.opacity)
    this.shader.uniform('uMinWidthRatio').setFloat(this.minWidthRatio)
    this.shader.uniform('uSpacingRatio').setFloat(this.spacingRatio)
    this.shader.uniform('uSoftness').setFloat(this.softness)

    return super.start(waypoint)
  }

  renderWaypoints(waypoints: Waypoint[], rect: Vec4) {
    const offsets = [
      new Vec2(-1,-1),
      new Vec2(-1,1),
      new Vec2(1,-1),
      new Vec2(1,1)
    ]
    const relIndices = [
      0, 1, 2,
      1, 2, 3
    ]
    const vertices = new Float32Array(waypoints.length * 20)
    const indices = new Uint16Array(waypoints.length * 6)
    for (let i = 0; i < waypoints.length; ++i) {
      const {pos, pressure} = waypoints[i]
      for (let j = 0; j < 4; ++j) {
        const offset = offsets[j]
        vertices.set([offset.x, offset.y, pos.x, pos.y, pressure], i * 20 + j * 5)
      }
      indices.set(relIndices.map(j => j + i * 4), i * 6)
    }
    this.dabsGeometry.vertexData = vertices
    this.dabsGeometry.indexData = indices
    this.dabsGeometry.updateBuffer()

    const uTileKey = this.shader.uniform("uTileKey")

    this.framebuffer.use()
    const {tiledTexture} = this.picture.currentLayer

    this.model.setBlendMode(this.eraser ? BlendMode.DstOut : BlendMode.SrcOver)

    for (const key of TiledTexture.keysForRect(rect)) {
      this.framebuffer.setTexture(tiledTexture.get(key))
      uTileKey.setVec2(key)
      this.model.render()
    }
  }

  renderSettings() {
    return React.createFactory(BrushSettings)({tool: this})
  }
}
