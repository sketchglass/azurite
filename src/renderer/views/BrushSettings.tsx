import * as React from "react"
import {observer} from "mobx-react"
import {brushPresetManager} from "../app/BrushPresetManager"
import RangeSlider from "./components/RangeSlider"

@observer
export default
class BrushSettings extends React.Component<{}, {}> {
  render() {
    const preset = brushPresetManager.currentPreset
    if (!preset) {
      return <table className="BrushSettings" />
    }
    const onOpacityChange = (value: number) => {
      preset.opacity = value / 100
    }
    const onWidthChange = (value: number) => {
      preset.width = value
    }
    const onMinWidthChange = (value: number) => {
      preset.minWidthRatio = value / 100
    }
    const onSoftnessChange = (value: number) => {
      preset.softness = value / 100
    }
    const onEraserModeChange = (ev: React.FormEvent<HTMLInputElement>) => {
      preset.type = ev.currentTarget.checked ? "eraser" : "normal"
    }
    const onBlendingChange = (value: number) => {
      preset.blending = value / 100
    }
    return (
      <table className="BrushSettings">
        <tbody>
          <tr>
            <td>Opacity</td>
            <td><RangeSlider onChange={onOpacityChange} min={0} max={100} value={Math.round(preset.opacity * 100)} postfix="%" /></td>
          </tr>
          <tr>
            <td>Blending</td>
            <td><RangeSlider onChange={onBlendingChange} min={0} max={100} value={Math.round(preset.blending * 100)} postfix="%" /></td>
          </tr>
          <tr>
            <td>Width</td>
            <td><RangeSlider onChange={onWidthChange} min={0} max={100} value={preset.width} postfix="px" /></td>
          </tr>
          <tr>
            <td>Min Width</td>
            <td><RangeSlider onChange={onMinWidthChange} min={0} max={100} value={Math.round(preset.minWidthRatio * 100)} postfix="%" /></td>
          </tr>
          <tr>
            <td>Softness</td>
            <td><RangeSlider onChange={onSoftnessChange} min={0} max={100} value={Math.round(preset.softness * 100)} postfix="%" /></td>
          </tr>
          <tr>
            <td>Eraser</td>
            <td><label><input type="checkbox" onChange={onEraserModeChange} checked={preset.type == "eraser"} /> Eraser Mode</label></td>
          </tr>
          <tr>
            <td>Stabilizing</td>
            <td><RangeSlider onChange={value => preset.stabilizingLevel = value} min={0} max={10} value={preset.stabilizingLevel} /></td>
          </tr>
        </tbody>
      </table>
    )
  }
}
