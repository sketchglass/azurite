import * as React from "react"
import {observer} from "mobx-react"
import DimensionSelectState, {dimensionPresets, DimensionUnit, DimensionPreset} from "../state/DimensionSelectState"

interface DimensionSelectProps {
  state: DimensionSelectState
}

@observer
export default
class DimensionSelect extends React.Component<DimensionSelectProps, {} > {
  render() {
    const {widthMm, heightMm, widthPx, heightPx, dpi, unit, keepRatio, tooLarge, isValid, currentPresetIndex} = this.props.state
    const width = unit == "mm" ? widthMm : widthPx
    const height = unit == "mm" ? heightMm : heightPx

    return (
      <div className="DimensionSelect">
        <div className="DimensionSelect_Row">
          <label>Preset</label>
          <select className="Select" value={currentPresetIndex} autoFocus onChange={this.onPresetSelect}>
            {dimensionPresets.map((preset, i) => <option key={i} value={i}>{preset.name}</option>)}
            <option value={-1}>Custom</option>
          </select>
        </div>
        <div className="DimensionSelect_Row">
          <label>Width</label>
          <div className="DimensionSelect_Value">
            <input className="TextInput" type="number" value={width} min={1} onChange={this.onWidthChange} />
            <select className="Select" value={unit} onChange={this.onUnitChange}>
              <option value="px">px</option>
              <option value="mm">mm</option>
            </select>
          </div>
        </div>
        <div className="DimensionSelect_Row">
          <label>Height</label>
          <div className="DimensionSelect_Value">
            <input className="TextInput" type="number" value={height} min={1} onChange={this.onHeightChange} />
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
            {widthPx || 0} x {heightPx || 0} px
            <span className="DimensionSelect_TooLarge" hidden={!tooLarge}>Too Large</span>
          </span>
        </div>
      </div>
    )
  }

  private onPresetSelect = (ev: React.FormEvent<HTMLSelectElement>) => {
    const i = parseInt((ev.target as HTMLSelectElement).value)
    if (i >= 0) {
      this.props.state.setPreset(dimensionPresets[i])
    }
  }

  private onUnitChange = (ev: React.FormEvent<HTMLSelectElement>) => {
    const unit = (ev.target as HTMLSelectElement).value as DimensionUnit
    this.props.state.changeUnit(unit)
  }

  private onWidthChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const width = parseInt((ev.target as HTMLInputElement).value)
    this.props.state.changeWidth(width)
  }

  private onHeightChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const height = parseInt((ev.target as HTMLInputElement).value)
    this.props.state.changeHeight(height)
  }

  private onDpiChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const dpi = parseInt((ev.target as HTMLInputElement).value) || 72
    this.props.state.changeDpi(dpi)
  }

  private onKeepRatioToggle = (ev: React.FormEvent<HTMLInputElement>) => {
    this.props.state.changeKeepRatio((ev.target as HTMLInputElement).checked)
  }
}
