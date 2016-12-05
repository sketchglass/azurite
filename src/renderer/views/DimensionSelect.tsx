import * as React from "react"
import {observer} from "mobx-react"
import DimensionSelectState, {DimensionUnit} from "../state/DimensionSelectState"

interface DimensionSelectProps {
  state: DimensionSelectState
}

@observer
export default
class DimensionSelect extends React.Component<DimensionSelectProps, {} > {
  render() {
    const {
      widthRounded, heightRounded,
      widthCurrentUnitRounded, heightCurrentUnitRounded,
      dpi, unit, keepRatio, tooLarge, isValid, lastSelectedPreset, presets
    } = this.props.state

    return (
      <div className="DimensionSelect">
        <div className="DimensionSelect_Row">
          <label>Preset</label>
          <select className="Select" value={lastSelectedPreset} autoFocus onChange={this.onPresetSelect}>
            {presets.map((preset, i) => <option key={i} value={i}>{preset.name}</option>)}
            <option value={-1}>Custom</option>
          </select>
        </div>
        <div className="DimensionSelect_Row">
          <label>Width</label>
          <div className="DimensionSelect_Value">
            <input className="TextInput" type="number" value={widthCurrentUnitRounded} min={1} onChange={this.onWidthChange} />
            <select className="Select" value={unit} onChange={this.onUnitChange}>
              <option value="px">px</option>
              <option value="mm">mm</option>
            </select>
          </div>
        </div>
        <div className="DimensionSelect_Row">
          <label>Height</label>
          <div className="DimensionSelect_Value">
            <input className="TextInput" type="number" value={heightCurrentUnitRounded} min={1} onChange={this.onHeightChange} />
            <select className="Select" value={unit} onChange={this.onUnitChange}>
              <option value="px">px</option>
              <option value="mm">mm</option>
            </select>
          </div>
        </div>
        <div className="DimensionSelect_Row">
          <label>Resolution</label>
          <div className="DimensionSelect_Value">
            <input className="TextInput" type="number" value={dpi} min={1} onChange={this.onDpiChange} />
            DPI
          </div>
        </div>
        <div className="DimensionSelect_Row">
          <label></label>
          <label>
            <input type="checkbox" checked={keepRatio} onChange={this.onKeepRatioToggle}/>
            Keep Ratio
          </label>
        </div>
        <div className="DimensionSelect_Row">
          <label></label>
          <span className="DimensionSelect_PixelSize">
            {widthRounded || 0} x {heightRounded || 0} px
            <span className="DimensionSelect_TooLarge" hidden={!tooLarge}>Too Large</span>
          </span>
        </div>
      </div>
    )
  }

  private onPresetSelect = (ev: React.FormEvent<HTMLSelectElement>) => {
    const i = parseInt((ev.target as HTMLSelectElement).value)
    if (i >= 0) {
      this.props.state.setPreset(i)
    }
  }

  private onUnitChange = (ev: React.FormEvent<HTMLSelectElement>) => {
    const unit = (ev.target as HTMLSelectElement).value as DimensionUnit
    this.props.state.unit = unit
  }

  private onWidthChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const width = parseInt((ev.target as HTMLInputElement).value)
    this.props.state.changeSizeCurrentUnit(width, undefined)
  }

  private onHeightChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const height = parseInt((ev.target as HTMLInputElement).value)
    this.props.state.changeSizeCurrentUnit(undefined, height)
  }

  private onDpiChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const dpi = parseInt((ev.target as HTMLInputElement).value) || 72
    this.props.state.dpi = dpi
  }

  private onKeepRatioToggle = (ev: React.FormEvent<HTMLInputElement>) => {
    this.props.state.keepRatio = (ev.target as HTMLInputElement).checked
  }
}
