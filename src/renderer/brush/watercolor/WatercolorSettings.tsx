import {observer} from "mobx-react"
import React = require("react")
import RangeSlider from "../../views/components/RangeSlider"
import {BrushPresetWatercolor} from "./BrushPresetWatercolor"

@observer export default
class WatercolorSettings extends React.Component<{preset: BrushPresetWatercolor}, void> {
  render() {
    const {preset} = this.props
    const onWidthChange = (value: number) => {
      preset.width = value
    }
    const onBlendingChange = (value: number) => {
      preset.blending = value / 100
    }
    const onThicknessChange = (value: number) => {
      preset.thickness = value / 100
    }
    const onMinWidthChange = (value: number) => {
      preset.minWidthRatio = value / 100
    }
    const onSoftnessChange = (value: number) => {
      preset.softness = value / 100
    }
    return (
      <table className="BrushSettings">
        <tbody>
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
            <td>Blending</td>
            <td><RangeSlider onChange={onBlendingChange} min={0} max={100} value={Math.round(preset.blending * 100)} postfix="%" /></td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td><RangeSlider onChange={onThicknessChange} min={0} max={100} value={Math.round(preset.thickness * 100)} postfix="%" /></td>
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
