import {Vec2, Vec4} from "../../lib/Geometry"
import {HSV} from "../../lib/Color"
import Waypoint from "./Waypoint"
import Tool from "./Tool"

export default
class BrushTool extends Tool {
  private lastWaypoint: Waypoint|undefined
  private nextDabOffset = 0
  width = 10
  color = HSV.rgb(0, 0, 0)
  opacity = 1
  minWidthRatio = 0.5
  sampleCanvas = document.createElement("canvas")
  sampleContext = this.sampleCanvas.getContext('2d')!

  start(waypoint: Waypoint) {
    this.lastWaypoint = waypoint
    this.nextDabOffset = 0
    this.sampleCanvas.width = this.sampleCanvas.height = Math.floor(this.width + 1)
  }

  move(waypoint: Waypoint) {
    if (this.lastWaypoint) {
      const {waypoints, nextOffset} = Waypoint.interpolate(this.lastWaypoint, waypoint, this.nextDabOffset)
      this.lastWaypoint = waypoint
      this.nextDabOffset = nextOffset
      for (const p of waypoints) {
        this.drawDab(p)
      }
    }
  }

  end() {
  }

  sampleColor(width: number, pos: Vec2) {
    const context = this.sampleContext
    const sampleSize = this.sampleCanvas.width
    const hw = this.width * 0.5
    const topLeft = pos.sub(new Vec2(hw, hw)).floor()

    const origData = this.layer.context.getImageData(topLeft.x, topLeft.y, sampleSize, sampleSize)
    context.putImageData(origData, 0, 0)

    context.globalCompositeOperation = "destination-in"
    context.fillStyle = "black"
    context.beginPath()
    context.arc(pos.x - topLeft.x, pos.y - topLeft.y, width * 0.5, 0, 2 * Math.PI)
    context.fill()

    const data = context.getImageData(0, 0, sampleSize, sampleSize)
    const nPix = sampleSize * sampleSize

    let rSum = 0
    let gSum = 0
    let bSum = 0
    let aSum = 0
    for (let i = 0; i < nPix; ++i) {
      if (data.data[i * 4 + 3] > 0) {
        rSum += data.data[i * 4]
        gSum += data.data[i * 4 + 1]
        bSum += data.data[i * 4 + 2]
        aSum += data.data[i * 4 + 3]
      }
    }

    const r = rSum / nPix / 255
    const g = gSum / nPix / 255
    const b = bSum / nPix / 255
    const a = aSum / nPix / 255

    return new Vec4(r * a, g * a, b * a, a)
  }

  drawDab(waypoint: Waypoint) {
    const {context} = this.layer
    const {pos, pressure} = waypoint

    // opacity
    const opacity = this.opacity * 0.5 // correct opacity to soften edge

    // brush width
    const width = this.width * (this.minWidthRatio + (1 - this.minWidthRatio) * pressure)

    // brush blending (how much old average color is used for blending)
    const blending = Math.min(1, 2 * pressure)

    // brush thickness (how much new color is added)
    const thickness = Math.max(0, 2 * pressure - 1)

    const color = this.color.toRgbaPremultiplied().mul(thickness)
    const blend = this.sampleColor(width, pos).mul(blending)
    const finalColor = color.add(blend.mul(1 - color.a)) // alpha-blend two colors

    const style = `rgba(${
      Math.round(finalColor.r / finalColor.a * 255)
    },${
      Math.round(finalColor.g / finalColor.a * 255)
    },${
      Math.round(finalColor.b / finalColor.a * 255)
    },${
      finalColor.a
    })`

    context.fillStyle = `rgba(0,0,0,${blending})`
    context.globalCompositeOperation = "destination-out"
    context.beginPath()
    context.arc(pos.x, pos.y, width * 0.5, 0, 2 * Math.PI)
    context.fill()
    context.globalCompositeOperation = "source-over"

    context.fillStyle = style
    context.beginPath()
    context.arc(pos.x, pos.y, width * 0.5, 0, 2 * Math.PI)
    context.fill()
  }
}

interface Color {
  r: number
  g: number
  b: number
  a: number
}
