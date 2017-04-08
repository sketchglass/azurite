import {observer} from 'mobx-react'
import * as React from 'react'
import {brushPresetManager} from '../app/BrushPresetManager'
import RangeSlider from './components/RangeSlider'

function PercentSlider(props: {value: number, onChange: (value: number) => void}) {
  const onPercentChange = (value: number) => {
    props.onChange(value / 100)
  }
  return <RangeSlider onChange={onPercentChange} min={0} max={100} value={Math.round(props.value * 100)} postfix="%" />
}

@observer
export default
class BrushSettings extends React.Component<{}, {}> {
  render() {
    const preset = brushPresetManager.currentPreset
    if (!preset) {
      return <table className="BrushSettings" />
    }
    const onEraserModeChange = (ev: React.FormEvent<HTMLInputElement>) => {
      preset.type = ev.currentTarget.checked ? 'eraser' : 'normal'
    }
    return (
      <table className="BrushSettings">
        <tbody>
          <tr>
            <td>Opacity</td>
            <td><PercentSlider value={preset.opacity} onChange={x => preset.opacity = x} /></td>
          </tr>
          <tr>
            <td>Min Opacity</td>
            <td><PercentSlider value={preset.minOpacityRatio} onChange={x => preset.minOpacityRatio = x} /></td>
          </tr>
          <tr>
            <td>Blending</td>
            <td><PercentSlider value={preset.blending} onChange={x => preset.blending = x} /></td>
          </tr>
          <tr>
            <td>Width</td>
            <td><RangeSlider min={0} max={100} value={preset.width} postfix="px" onChange={x => preset.width = x} /></td>
          </tr>
          <tr>
            <td>Min Width</td>
            <td><PercentSlider value={preset.minWidthRatio} onChange={x => preset.minWidthRatio = x} /></td>
          </tr>
          <tr>
            <td>Softness</td>
            <td><PercentSlider value={preset.softness} onChange={x => preset.softness = x} /></td>
          </tr>
          <tr>
            <td>Eraser</td>
            <td><label><input type="checkbox" onChange={onEraserModeChange} checked={preset.type === 'eraser'} /> Eraser Mode</label></td>
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
