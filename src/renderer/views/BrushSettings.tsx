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
    const onSoftnessChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.softness = parseInt((ev.target as HTMLInputElement).value) / 100
      this.forceUpdate()
    }
    const onEraserModeChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.eraser = !tool.eraser
      this.forceUpdate()
    }
    return (
      <table className="BrushSettings">
        <tbody>
          <tr>
            <td>Color</td>
            <td><input type="color" onChange={onColorChange} value={toHexColor(tool.color)} /></td>
          </tr>
          <tr>
            <td>Opacity</td>
            <td><input type="range" onChange={onOpacityChange} value={Math.round(tool.opacity * 100)} /></td><td>{Math.round(tool.opacity * 100)}%</td>
          </tr>
          <tr>
            <td>Width</td>
            <td><input type="range" onChange={onWidthChange} value={tool.width} /></td><td>{tool.width}px</td>
          </tr>
          <tr>
            <td>Min Width</td>
            <td><input type="range" onChange={onMinWidthChange} value={Math.round(tool.minWidthRatio * 100)} /></td><td>{Math.round(tool.minWidthRatio * 100)}%</td>
          </tr>
          <tr>
            <td>Softness</td>
            <td><input type="range" onChange={onSoftnessChange} value={Math.round(tool.softness * 100)} /></td><td>{Math.round(tool.softness * 100)}%</td>
          </tr>
          <tr>
            <td>Eraser</td>
            <td><label><input type="checkbox" onChange={onEraserModeChange} checked={tool.eraser} /> Eraser Mode</label></td>
          </tr>
        </tbody>
      </table>
    )
  }
}
