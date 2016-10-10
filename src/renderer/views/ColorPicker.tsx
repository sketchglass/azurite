import React = require("react")
import {Vec2} from "../../lib/Geometry"
import {HSVColor} from "../../lib/Color"
import {mouseOffsetPos} from "./util"

const wheelWidth = 16
const squareSize = 96
const wheelSize = squareSize * 1.5 + wheelWidth * 2

interface ColorPickerProps {
  color: HSVColor
  onChange: (color: HSVColor) => void
}

function atan2ToHue(arg: number) { // atan2: -PI ... PI
  return (arg / Math.PI + 1) * 180
}

function hueToAtan2(hue: number) { // hue: 0 ... 360
  return (hue / 180 - 1) * Math.PI
}

function clamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max)
}

export default
class ColorPicker extends React.Component<ColorPickerProps, {}> {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  wheelGradient: ImageData
  squareGradient: ImageData
  draggingWheel = false
  draggingSquare = false

  constructor() {
    super();
  }

  componentDidMount() {
    this.canvas = this.refs["canvas"] as HTMLCanvasElement
    this.context = this.canvas.getContext("2d")!
    this.wheelGradient = this.createWheelGradient()
    this.squareGradient = this.context.createImageData(squareSize, squareSize)
    this.update()
  }

  render() {
    this.update()
    return (
      <canvas ref="canvas" width={wheelSize} height={wheelSize}
        onMouseDown={this.onMouseDown.bind(this)} onMouseMove={this.onMouseMove.bind(this)} onMouseUp={this.onMouseUp.bind(this)} />
    )
  }

  onMouseDown(event: MouseEvent) {
    const center = new Vec2(wheelSize / 2, wheelSize / 2)
    const pos = mouseOffsetPos(event, this.canvas).sub(center)
    const r = pos.length()
    if (wheelSize / 2 - wheelWidth <= r && r <= wheelSize / 2) {
      // wheel clicked
      this.draggingWheel = true
      this.onHueChanged(this.posToHue(pos))
      return
    }
    if (Math.abs(pos.x) <= squareSize / 2 && Math.abs(pos.y) <= squareSize / 2) {
      // square clicked
      this.draggingSquare = true
      this.onSVChanged(this.posToSV(pos))
    }
  }
  onMouseMove(event: MouseEvent) {
    const center = new Vec2(wheelSize / 2, wheelSize / 2)
    const pos = mouseOffsetPos(event, this.canvas).sub(center)
    if (this.draggingWheel) {
      this.onHueChanged(this.posToHue(pos))
    } else if (this.draggingSquare) {
      this.onSVChanged(this.posToSV(pos))
    }
  }
  onMouseUp(event: MouseEvent) {
    this.draggingWheel = false
    this.draggingSquare = false
  }
  onHueChanged(h: number) {
    const {s, v} = this.props.color
    this.update()
    this.props.onChange(new HSVColor(h, s, v))
  }
  onSVChanged(sv: {s: number, v: number}) {
    const {s, v} = sv
    const {h} = this.props.color
    this.update()
    this.props.onChange(new HSVColor(h, s, v))
  }

  posToHue(pos: Vec2) {
    return atan2ToHue(pos.atan2());
  }
  posToSV(pos: Vec2) {
    const s = clamp(pos.x / squareSize + 0.5, 0, 1)
    const v = 1 - clamp(pos.y / squareSize + 0.5, 0, 1)
    return {s, v}
  }

  drawSquare() {
    const image = this.squareGradient
    const center = new Vec2(squareSize / 2, squareSize / 2)
    const temporaryColor = new HSVColor(0, 0, 0, 1)
    for (let y = 0; y < squareSize; ++y) {
      for (let x = 0; x < squareSize; ++x) {
        const pos = new Vec2(x + 0.5, y + 0.5).sub(center)
        const {s, v} = this.posToSV(pos)
        temporaryColor.h = this.props.color.h
        temporaryColor.s = s
        temporaryColor.v = v
        const color = temporaryColor.toRgb()
        setPixel(image, x, y, color)
      }
    }

    this.context.putImageData(image, (wheelSize - squareSize) / 2, (wheelSize - squareSize) / 2)
  }

  createWheelGradient() {
    const {context} = this
    const image = context.createImageData(wheelSize, wheelSize)
    const center = new Vec2(wheelSize / 2, wheelSize / 2)

    for (let y = 0; y < wheelSize; ++y) {
      for (let x = 0; x < wheelSize; ++x) {
        const pos = new Vec2(x + 0.5, y + 0.5).sub(center)
        const hue = this.posToHue(pos)
        const color = new HSVColor(hue, 1, 1).toRgb()
        setPixel(image, x, y, color)
      }
    }

    return image
  }

  update() {
    requestAnimationFrame(() => {
      this.clear()
      this.drawWheel()
      this.drawSquare()
      this.drawHCursor()
      this.drawSVCursor()
    })
  }

  clear() {
    const {context} = this
    context.clearRect(0, 0, wheelSize, wheelSize)
  }

  drawWheel() {
    const {context} = this

    context.putImageData(this.wheelGradient, 0, 0)

    context.globalCompositeOperation = "destination-in"
    context.lineWidth = wheelWidth

    const radius = wheelSize / 2

    context.beginPath()
    context.arc(radius, radius, radius - wheelWidth / 2, 0, 2 * Math.PI)
    context.stroke()

    context.globalCompositeOperation = "source-over"
  }

  drawSVCursor() {
    const {context} = this
    const {s, v} = this.props.color
    const x = (wheelSize - squareSize) / 2 + s * squareSize
    const y = (wheelSize - squareSize) / 2 + (1 - v) * squareSize

    context.lineWidth = 2
    context.strokeStyle = "white"
    context.fillStyle = this.props.color.toString()
    context.beginPath()
    context.arc(x, y, 8, 0, 2 * Math.PI)
    context.fill()
    context.stroke()
  }

  drawHCursor() {
    const {context} = this
    const {h} = this.props.color
    const arg = hueToAtan2(h)
    const r = wheelSize / 2 - wheelWidth / 2
    const x = wheelSize / 2 + Math.cos(arg) * r
    const y = wheelSize / 2 + Math.sin(arg) * r

    context.lineWidth = 2
    context.strokeStyle = "white"
    context.fillStyle = new HSVColor(h, 1, 1).toString()
    context.beginPath()
    context.arc(x, y, 8, 0, 2 * Math.PI)
    context.fill()
    context.stroke()
  }
}

function setPixel(image: ImageData, x: number, y: number, color: {r: number, g: number, b: number, a: number}) {
  const offset = (x + image.width * y) * 4
  image.data[offset] = color.r * 255
  image.data[offset + 1] = color.g * 255
  image.data[offset + 2] = color.b * 255
  image.data[offset + 3] = color.a * 255
}
