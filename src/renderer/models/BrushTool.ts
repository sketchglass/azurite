import {Vec2, Vec4, Transform, unionRect} from "../../lib/Geometry"
import Waypoint from "./Waypoint"
import Tool from "./Tool"
import {Geometry, Shader, Model, GeometryUsage, Framebuffer} from "../../lib/GL"
import {context} from "../GLContext"
import BrushSettings from "../views/BrushSettings"
import React = require("react")

const brushVertShader = `
  precision mediump float;

  uniform float uBrushSize;
  uniform float uMinWidthRatio;
  uniform mat3 uTransform;
  uniform float uOpacity;

  attribute vec2 aPosition;
  attribute float aPressure;

  varying float vRadius;
  varying lowp float vOpacity;

  void main(void) {
    vec3 pos = uTransform * vec3(aPosition, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);
    gl_PointSize = uBrushSize + 2.0;
    float radius = uBrushSize * 0.5 * (uMinWidthRatio + (1.0 - uMinWidthRatio) * aPressure);
    vRadius = radius;
    // transparency = (overlap count) √ (final transparency)
    vOpacity = 1.0 - pow(1.0 - min(uOpacity, 0.998), 1.0 / (radius * 2.0));
  }
`

const brushFragShader = `
  precision mediump float;

  uniform float uBrushSize;
  uniform lowp vec4 uColor;

  varying float vRadius;
  varying lowp float vOpacity;

  void main(void) {
    float r = distance(gl_PointCoord, vec2(0.5)) * (uBrushSize + 2.0);
    lowp float opacity = smoothstep(vRadius, vRadius- 1.0, r);
    gl_FragColor = uColor * opacity * vOpacity;
  }
`

export default
class BrushTool extends Tool {
  private lastWaypoint: Waypoint|undefined
  private nextDabOffset = 0
  width = 10
  color = new Vec4(0, 0, 0, 1)
  opacity = 1
  minWidthRatio = 0.5
  spacingRatio = 0.1
  dabsGeometry = new Geometry(context, new Float32Array(0), [
    {attribute: "aPosition", size: 2},
    {attribute: "aPressure", size: 1},
  ], GeometryUsage.Stream)
  framebuffer = new Framebuffer(context)
  shader = new Shader(context, brushVertShader, brushFragShader)
  model = new Model(context, this.dabsGeometry, this.shader)
  name = "Brush"

  start(waypoint: Waypoint) {
    this.lastWaypoint = waypoint
    this.nextDabOffset = 0

    this.framebuffer.setTexture(this.layer.texture)

    const opacityCorrection = 1 - Math.pow(1 / 255, this.spacingRatio)

    const layerSize = this.layer.size
    const transform =
      Transform.scale(new Vec2(2 / layerSize.width, 2 / layerSize.height))
        .merge(Transform.translate(new Vec2(-1, -1)))
    this.shader.setUniform('uTransform', transform)
    this.shader.setUniform('uBrushSize', this.width)
    this.shader.setUniform('uColor', this.color)
    this.shader.setUniform('uOpacity', this.opacity)
    this.shader.setUniform('uMinWidthRatio', this.minWidthRatio)

    return new Vec4(0)
  }

  move(waypoint: Waypoint) {
    if (!this.lastWaypoint) {
      return new Vec4(0)
    }

    const getNextSpacing = (waypoint: Waypoint) => {
      const brushSize = this.width * (this.minWidthRatio + (1 - this.minWidthRatio) * waypoint.pressure)
      return brushSize * this.spacingRatio
    }
    const {waypoints, nextOffset} = Waypoint.interpolate(this.lastWaypoint, waypoint, getNextSpacing, this.nextDabOffset)
    this.lastWaypoint = waypoint
    this.nextDabOffset = nextOffset

    if (waypoints.length == 0) {
      return new Vec4(0)
    }
    const rectWidth = this.width + 2

    const vertices = new Float32Array(waypoints.length * 3)
    for (const [i, {pos, pressure}] of waypoints.entries()) {
      vertices.set([pos.x, pos.y, pressure], i * 3)
    }
    this.dabsGeometry.data = vertices
    this.dabsGeometry.updateBuffer()

    this.framebuffer.use(() => {
      this.model.renderPoints()
    })

    const rects = waypoints.map(w => new Vec4(w.pos.x - rectWidth * 0.5, w.pos.y - rectWidth * 0.5, rectWidth, rectWidth))
    return unionRect(...rects)
  }

  end() {
    return new Vec4(0)
  }

  renderSettings() {
    return React.createFactory(BrushSettings)({tool: this})
  }
}
