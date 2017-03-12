import React = require("react")
import { Color } from "paintgl"
import { HSVColor } from "../../../lib/Color"
import ColorSlider from "./ColorSlider"
import "./RGBRangeSliders.css"

interface RGBRangeSlidersProps {
  color: HSVColor
  onChange: (color: HSVColor) => void
}

export default
class RGBRangeSliders extends React.Component<RGBRangeSlidersProps, void> {
  color: Color
  constructor(props: RGBRangeSlidersProps) {
    super(props)
    this.color = this.props.color.toRgb()
  }
  componentWillReceiveProps(props: RGBRangeSlidersProps) {
    this.color = props.color.toRgb()
  }
  onChangeR = (value: number) => {
    this.color.r = value
    const {r, g, b} = this.color
    this.props.onChange(HSVColor.rgb(r, g, b))
    this.forceUpdate()
  }
  onChangeG = (value: number) => {
    this.color.g = value
    const {r, g, b} = this.color
    this.props.onChange(HSVColor.rgb(r, g, b))
    this.forceUpdate()
  }
  onChangeB = (value: number) => {
    this.color.b = value
    const {r, g, b} = this.color
    this.props.onChange(HSVColor.rgb(r, g, b))
    this.forceUpdate()
  }
  render() {
    const {color} = this
    const {r, g, b} = color
    return (
      <div className="RGBRangeSliders">
        <ColorSlider color={color} value={color.r} onChange={this.onChangeR} gradientSteps={[[new Color(0, g, b, 1), 0], [new Color(1, g, b, 1), 1]]} />
        <ColorSlider color={color} value={color.g} onChange={this.onChangeG} gradientSteps={[[new Color(r, 0, b, 1), 0], [new Color(r, 1, b, 1), 1]]} />
        <ColorSlider color={color} value={color.b} onChange={this.onChangeB} gradientSteps={[[new Color(r, g, 0, 1), 0], [new Color(r, g, 1, 1), 1]]} />
      </div>
    )
  }
}
