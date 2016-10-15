import React = require("react")
import { Color } from "paintgl"
import { HSVColor } from "../../../lib/Color"
import RangeSlider from "./RangeSlider"

interface RGBRangeSliderProps {
  color: Color
  width: number
  height: number
}

class BaseBackground extends React.Component<RGBRangeSliderProps, void> {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  componentDidMount() {
    this.context = this.canvas.getContext("2d")!
    this.update()
  }
  componentWillReceiveProps() {
    this.update()
  }
  createLinerGradient() {
    // do something
  }
  update = () => {
    this.createLinerGradient()
  }
  render() {
    return (
      <canvas width={this.props.width} height={this.props.height} ref={c => { this.canvas = c }}/>
    )
  }
}
class backgroundR extends BaseBackground {
  createLinerGradient() {
    const {context} = this
    const {g, b} = this.props.color
    context.beginPath()
    const grad = context.createLinearGradient(0, 0, this.props.width, 0)
    const color1 = HSVColor.rgb(0, g, b).toString()
    const color2 = HSVColor.rgb(1, g, b).toString()
    grad.addColorStop(0, color1)
    grad.addColorStop(1, color2)
    context.fillStyle = grad
    context.rect(0, 0, this.props.width, this.props.height)
    context.fill()
  }
}
class backgroundG extends BaseBackground {
  createLinerGradient() {
    const {context} = this
    const {r, b} = this.props.color
    context.beginPath()
    const grad = context.createLinearGradient(0, 0, this.props.width, 0)
    const color1 = HSVColor.rgb(r, 0, b).toString()
    const color2 = HSVColor.rgb(r, 1, b).toString()
    grad.addColorStop(0, color1)
    grad.addColorStop(1, color2)
    context.fillStyle = grad
    context.rect(0, 0, this.props.width, this.props.height)
    context.fill()
  }
}
class backgroundB extends BaseBackground {
  createLinerGradient() {
    const {context} = this
    const {r, g} = this.props.color
    context.beginPath()
    const grad = context.createLinearGradient(0, 0, this.props.width, 0)
    const color1 = HSVColor.rgb(r, g, 0).toString()
    const color2 = HSVColor.rgb(r, g, 1).toString()
    grad.addColorStop(0, color1)
    grad.addColorStop(1, color2)
    context.fillStyle = grad
    context.rect(0, 0, this.props.width, this.props.height)
    context.fill()
  }
}
interface RGBRangeSlidersProps {
  color: HSVColor
  onChange: (color: HSVColor) => void
}
class RGBRangeSliders extends React.Component<RGBRangeSlidersProps, void> {
  color: Color
  componentWillMount() {
    this.color = this.props.color.toRgb()
  }
  componentWillReceiveProps(props: RGBRangeSlidersProps) {
    this.color = props.color.toRgb()
  }
  onChangeR = (value: number) => {
    this.color.r = value / 255
    const {r, g, b} = this.color
    this.props.onChange(HSVColor.rgb(r, g, b))
    this.forceUpdate()
  }
  onChangeG = (value: number) => {
    this.color.g = value / 255
    const {r, g, b} = this.color
    this.props.onChange(HSVColor.rgb(r, g, b))
    this.forceUpdate()
  }
  onChangeB = (value: number) => {
    this.color.b = value / 255
    const {r, g, b} = this.color
    this.props.onChange(HSVColor.rgb(r, g, b))
    this.forceUpdate()
  }
  render() {
    const width = 200
    const height = 20
    return (
      <div>
        <RangeSlider backgroundComponent={backgroundR} backgroundComponentProps={{color: this.color, width, height}} max={255} min={0} value={Math.round(this.color.r * 255)} onChange={this.onChangeR} />
        <RangeSlider backgroundComponent={backgroundG} backgroundComponentProps={{color: this.color, width, height}} max={255} min={0} value={Math.round(this.color.g * 255)} onChange={this.onChangeG} />
        <RangeSlider backgroundComponent={backgroundB} backgroundComponentProps={{color: this.color, width, height}} max={255} min={0} value={Math.round(this.color.b * 255)} onChange={this.onChangeB} />
      </div>
    )
  }
}
export default RGBRangeSliders
