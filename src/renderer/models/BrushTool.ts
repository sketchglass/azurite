import {Vec2, Vec4, Transform} from "../../lib/Geometry"
import Waypoint from "./Waypoint"
import Tool from "./Tool"
import {VertexBuffer, Shader, Model, VertexBufferUsage, Framebuffer} from "../../lib/GL"
import {context} from "../GLContext"

class BrushShader extends Shader {
  get vertexShader() {
    return `
      precision mediump float;

      uniform mediump float uBrushSize;
      uniform mat3 uTransform;
      attribute vec2 aPosition;
      attribute vec2 aUVPosition;
      varying vec2 vUVPosition;

      void main(void) {
        vUVPosition = aUVPosition;
        vec3 pos = uTransform * vec3(aPosition, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
        gl_PointSize = uBrushSize + 2.0;
      }
    `
  }

  get fragmentShader() {
    return `
      precision mediump float;
      varying mediump vec2 vUVPosition;
      uniform mediump float uBrushSize;
      uniform mediump float uMinWidthRatio;
      uniform lowp vec4 uColor;

      void main(void) {
        float r = distance(gl_PointCoord, vec2(0.5)) * (uBrushSize + 2.0);
        float radius = uBrushSize * 0.5 * (uMinWidthRatio + (1.0 - uMinWidthRatio) * vUVPosition.x);
        lowp float opacity = smoothstep(radius, radius - 1.0, r);
        gl_FragColor = uColor * opacity;
      }
    `
  }
}

export default
class BrushTool extends Tool {
  private lastWaypoint: Waypoint|undefined
  private nextDabOffset = 0
  width = 10
  color = new Vec4(0, 0, 0, 1)
  opacity = 1
  minWidthRatio = 0.5
  dabsBuffer = new VertexBuffer(context, new Float32Array(0), VertexBufferUsage.StreamDraw)
  framebuffer = new Framebuffer(context, new Vec2(0))
  shader = new BrushShader(context)
  model = new Model(context, this.dabsBuffer, this.shader)

  start(waypoint: Waypoint) {
    this.lastWaypoint = waypoint
    this.nextDabOffset = 0

    this.framebuffer.size = this.layer.size
    this.framebuffer.setTexture(this.layer.texture)

    const layerSize = this.layer.size
    const transform =
      Transform.scale(new Vec2(2 / layerSize.width, -2 / layerSize.height))
        .merge(Transform.translate(new Vec2(-1, 1)))
    this.shader.setTransform(transform)
    this.shader.setUniformFloat('uBrushSize', this.width)
    this.shader.setUniformVec4('uColor', this.color.mul(this.opacity))
    this.shader.setUniformFloat('uMinWidthRatio', this.minWidthRatio)
  }

  move(waypoint: Waypoint) {
    if (this.lastWaypoint) {
      const {waypoints, nextOffset} = Waypoint.interpolate(this.lastWaypoint, waypoint, this.nextDabOffset)
      this.lastWaypoint = waypoint
      this.nextDabOffset = nextOffset

      if (waypoints.length == 0) {
        return
      }

      const vertices = new Float32Array(waypoints.length * 4)
      for (const [i, {pos, pressure}] of waypoints.entries()) {
        // store pressure in u coordinate
        vertices.set([pos.x, pos.y, pressure, 0], i * 4)
      }
      this.dabsBuffer.data = vertices
      this.dabsBuffer.updateBuffer()

      this.framebuffer.use(() => {
        this.model.renderPoints()
      })
    }
  }

  end() {
  }
}
