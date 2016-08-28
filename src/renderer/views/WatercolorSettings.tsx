import React = require("react")
import WatercolorTool from "../models/WatercolorTool"
import {parseHexColor, toHexColor} from "../../lib/Color"

interface WatercolorSettingsProps {
  tool: WatercolorTool
}

export default
class WatercolorSettings extends React.Component<WatercolorSettingsProps, void> {
  constructor() {
    super();
  }

  render() {
    const {tool} = this.props
    const onColorChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.color = parseHexColor((ev.target as HTMLInputElement).value)
      this.forceUpdate()
    }
    const onWidthChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.width = parseInt((ev.target as HTMLInputElement).value)
      this.forceUpdate()
    }
    const onBlendingChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.blending = parseInt((ev.target as HTMLInputElement).value) / 100
      this.forceUpdate()
    }
    const onThicknessChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.thickness = parseInt((ev.target as HTMLInputElement).value) / 100
      this.forceUpdate()
    }
    return (
      <table className="brush-settings">
        <tbody>
          <tr>
            <td>Color</td>
            <td><input type="color" onChange={onColorChange} value={toHexColor(tool.color)} /></td>
          </tr>
          <tr>
            <td>Width</td>
            <td><input type="range" onChange={onWidthChange} value={tool.width} /> {tool.width}px</td>
          </tr>
          <tr>
            <td>Blending</td>
            <td><input type="range" onChange={onBlendingChange} value={Math.round(tool.blending * 100)} /> {Math.round(tool.blending * 100)}%</td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td><input type="range" onChange={onThicknessChange} value={Math.round(tool.thickness * 100)} /> {Math.round(tool.thickness * 100)}%</td>
          </tr>
        </tbody>
      </table>
    )
  }
}
