import {Vec2, Vec4, Transform} from "../../lib/Geometry"
import {HSV} from "../../lib/Color"
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
      precision lowp float;
      varying mediump vec2 vUVPosition;
      uniform mediump float uBrushSize;
      uniform vec4 uColor;

      void main(void) {
        float r = distance(gl_PointCoord, vec2(0.5)) * (uBrushSize + 2.0);
        float opacity = smoothstep(uBrushSize * 0.5, uBrushSize * 0.5 - 1.0, r);
        gl_FragColor = uColor * opacity;
      }
    `
  }

  setBrushSize(size: number) {
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform1f(gl.getUniformLocation(this.program, 'uBrushSize')!, size)
  }

  setColor(color: Vec4) {
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform4fv(gl.getUniformLocation(this.program, 'uColor')!, color.toGLData())
  }
}

export default
class BrushTool extends Tool {
  private lastWaypoint: Waypoint|undefined
  private nextDabOffset = 0
  width = 10
  color = HSV.rgb(0, 0, 0)
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
    this.framebuffer.setTextures(this.layer.texture)
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
        const layerSize = this.layer.size
        const transform =
          Transform.scale(new Vec2(2 / layerSize.width, -2 / layerSize.height))
            .merge(Transform.translate(new Vec2(-1, 1)))
        this.shader.setTransform(transform)
        this.shader.setBrushSize(this.width)
        this.shader.setColor(this.color.toRgbaPremultiplied())
        this.model.renderPoints()
      })
    }
  }

  end() {
  }
  //
  // sampleColor(width: number, pos: Vec2) {
  //   const context = this.sampleContext
  //   const sampleSize = this.sampleCanvas.width
  //   const hw = this.width * 0.5
  //   const topLeft = pos.sub(new Vec2(hw, hw)).floor()
  //
  //   const origData = this.layer.context.getImageData(topLeft.x, topLeft.y, sampleSize, sampleSize)
  //   context.putImageData(origData, 0, 0)
  //
  //   context.globalCompositeOperation = "destination-in"
  //   context.fillStyle = "black"
  //   context.beginPath()
  //   context.arc(pos.x - topLeft.x, pos.y - topLeft.y, width * 0.5, 0, 2 * Math.PI)
  //   context.fill()
  //
  //   const data = context.getImageData(0, 0, sampleSize, sampleSize)
  //   const nPix = sampleSize * sampleSize
  //
  //   let rSum = 0
  //   let gSum = 0
  //   let bSum = 0
  //   let aSum = 0
  //   for (let i = 0; i < nPix; ++i) {
  //     if (data.data[i * 4 + 3] > 0) {
  //       rSum += data.data[i * 4]
  //       gSum += data.data[i * 4 + 1]
  //       bSum += data.data[i * 4 + 2]
  //       aSum += data.data[i * 4 + 3]
  //     }
  //   }
  //
  //   const r = rSum / nPix / 255
  //   const g = gSum / nPix / 255
  //   const b = bSum / nPix / 255
  //   const a = aSum / nPix / 255
  //
  //   return new Vec4(r * a, g * a, b * a, a)
  // }
  //
  // drawDab(waypoint: Waypoint) {
  //   const {context} = this.layer
  //   const {pos, pressure} = waypoint
  //
  //   // opacity
  //   const opacity = this.opacity * 0.5 // correct opacity to soften edge
  //
  //   // brush width
  //   const width = this.width * (this.minWidthRatio + (1 - this.minWidthRatio) * pressure)
  //
  //   // brush blending (how much old average color is used for blending)
  //   const blending = Math.min(1, 2 * pressure)
  //
  //   // brush thickness (how much new color is added)
  //   const thickness = Math.max(0, 2 * pressure - 1)
  //
  //   const color = this.color.toRgbaPremultiplied().mul(thickness)
  //   const blend = this.sampleColor(width, pos).mul(blending)
  //   const finalColor = color.add(blend.mul(1 - color.a)) // alpha-blend two colors
  //
  //   const style = `rgba(${
  //     Math.round(finalColor.r / finalColor.a * 255)
  //   },${
  //     Math.round(finalColor.g / finalColor.a * 255)
  //   },${
  //     Math.round(finalColor.b / finalColor.a * 255)
  //   },${
  //     finalColor.a
  //   })`
  //
  //   context.fillStyle = `rgba(0,0,0,${blending})`
  //   context.globalCompositeOperation = "destination-out"
  //   context.beginPath()
  //   context.arc(pos.x, pos.y, width * 0.5, 0, 2 * Math.PI)
  //   context.fill()
  //   context.globalCompositeOperation = "source-over"
  //
  //   context.fillStyle = style
  //   context.beginPath()
  //   context.arc(pos.x, pos.y, width * 0.5, 0, 2 * Math.PI)
  //   context.fill()
  // }
}

interface Color {
  r: number
  g: number
  b: number
  a: number
}
