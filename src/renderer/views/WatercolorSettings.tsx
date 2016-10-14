import {observer} from "mobx-react"
import React = require("react")
import WatercolorTool from "../models/WatercolorTool"
import {parseHexColor, toHexColor} from "../../lib/Color"
import RangeSlider from "./components/RangeSlider"

interface WatercolorSettingsProps {
  tool: WatercolorTool
}

@observer export default
class WatercolorSettings extends React.Component<WatercolorSettingsProps, void> {
  render() {
    const {tool} = this.props
    const onWidthChange = (value: number) => {
      tool.width = value
    }
    const onBlendingChange = (value: number) => {
      tool.blending = value / 100
    }
    const onThicknessChange = (value: number) => {
      tool.thickness = value / 100
    }
    const onMinWidthChange = (value: number) => {
      tool.minWidthRatio = value / 100
    }
    const onSoftnessChange = (value: number) => {
      tool.softness = value / 100
    }
    return (
      <table className="BrushSettings">
        <tbody>
          <tr>
            <td>Width</td>
            <td><RangeSlider onChange={onWidthChange} min={0} max={100} value={tool.width} /></td><td>{tool.width}px</td>
          </tr>
          <tr>
            <td>Min Width</td>
            <td><RangeSlider onChange={onMinWidthChange} min={0} max={100} value={Math.round(tool.minWidthRatio * 100)} /></td><td>{Math.round(tool.minWidthRatio * 100)}%</td>
          </tr>
          <tr>
            <td>Softness</td>
            <td><RangeSlider onChange={onSoftnessChange} min={0} max={100} value={Math.round(tool.softness * 100)} /></td><td>{Math.round(tool.softness * 100)}%</td>
          </tr>
          <tr>
            <td>Blending</td>
            <td><RangeSlider onChange={onBlendingChange} min={0} max={100} value={Math.round(tool.blending * 100)} /></td><td>{Math.round(tool.blending * 100)}%</td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td><RangeSlider onChange={onThicknessChange} min={0} max={100} value={Math.round(tool.thickness * 100)} /></td><td>{Math.round(tool.thickness * 100)}%</td>
          </tr>
        </tbody>
      </table>
    )
  }
}
