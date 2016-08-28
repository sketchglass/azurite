import React = require("react")
import BrushTool from "../models/BrushTool"
import {parseHexColor, toHexColor} from "../../lib/Color"

interface BrushSettingsProps {
  tool: BrushTool
}

export default
class BrushSettings extends React.Component<BrushSettingsProps, void> {
  constructor() {
    super();
  }

  render() {
    const {tool} = this.props
    const onColorChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.color = parseHexColor((ev.target as HTMLInputElement).value)
      this.forceUpdate()
    }
    const onOpacityChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.opacity = parseInt((ev.target as HTMLInputElement).value) / 100
      this.forceUpdate()
    }
    const onWidthChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.width = parseInt((ev.target as HTMLInputElement).value)
      this.forceUpdate()
    }
    const onMinWidthChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.minWidthRatio = parseInt((ev.target as HTMLInputElement).value) / 100
      this.forceUpdate()
    }
    const onSpacingChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.spacingRatio = parseInt((ev.target as HTMLInputElement).value) / 100
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
            <td>Opacity</td>
            <td><input type="range" onChange={onOpacityChange} value={Math.round(tool.opacity * 100)} /> {Math.round(tool.opacity * 100)}%</td>
          </tr>
          <tr>
            <td>Width</td>
            <td><input type="range" onChange={onWidthChange} value={tool.width} /> {tool.width}px</td>
          </tr>
          <tr>
            <td>Min Width</td>
            <td><input type="range" onChange={onMinWidthChange} value={Math.round(tool.minWidthRatio * 100)} /> {Math.round(tool.minWidthRatio * 100)}%</td>
          </tr>
          <tr>
            <td>Spacing</td>
            <td><input type="range" onChange={onSpacingChange} value={Math.round(tool.spacingRatio * 100)} /> {Math.round(tool.spacingRatio * 100)}%</td>
          </tr>
        </tbody>
      </table>
    )
  }
}
