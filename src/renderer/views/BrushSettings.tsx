import {observer} from "mobx-react"
import React = require("react")
import BrushTool from "../tools/BrushTool"
import RangeSlider from "./components/RangeSlider"

interface BrushSettingsProps {
  tool: BrushTool
}

@observer export default
class BrushSettings extends React.Component<BrushSettingsProps, void> {
  render() {
    const {tool} = this.props
    const onOpacityChange = (value: number) => {
      tool.opacity = value / 100
    }
    const onWidthChange = (value: number) => {
      tool.width = value
    }
    const onMinWidthChange = (value: number) => {
      tool.minWidthRatio = value / 100
    }
    const onSoftnessChange = (value: number) => {
      tool.softness = value / 100
    }
    const onEraserModeChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.eraser = !tool.eraser
    }
    return (
      <table className="BrushSettings">
        <tbody>
          <tr>
            <td>Opacity</td>
            <td><RangeSlider onChange={onOpacityChange} min={0} max={100} value={Math.round(tool.opacity * 100)} /></td><td>{Math.round(tool.opacity * 100)}%</td>
          </tr>
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
            <td>Eraser</td>
            <td><label><input type="checkbox" onChange={onEraserModeChange} checked={tool.eraser} /> Eraser Mode</label></td>
          </tr>
          <tr>
            <td>Stabilizing</td>
            <td><RangeSlider onChange={value => tool.stabilizingLevel = value} min={0} max={10} value={tool.stabilizingLevel} /></td><td>{tool.stabilizingLevel}</td>
          </tr>
        </tbody>
      </table>
    )
  }
}
