import * as React from "react"
import {observer} from "mobx-react"
import DimensionSelectState, {DimensionUnit} from "../app/DimensionSelectState"

interface DimensionSelectProps {
  percent?: boolean
  state: DimensionSelectState
}

function toFixedNumber(x: number, digits: number) {
  const pow = Math.pow(10, digits)
  return Math.round(x * pow) / pow
}

@observer
export default
class DimensionSelect extends React.Component<DimensionSelectProps, {} > {
  private digitsForUnit(unit: DimensionUnit) {
    switch (unit) {
      case "px":
      case "mm":
        return 0
      case "inch":
      case "percent":
        return 1
    }
  }

  render() {
    const {
      widthRounded, heightRounded,
      widthCurrentUnit, heightCurrentUnit,
      dpi, unit, keepRatio, tooLarge, lastSelectedPreset, presets
    } = this.props.state
    const digits = this.digitsForUnit(unit)
    const step = Math.pow(10, -digits)
    const widthCurrentUnitRounded = toFixedNumber(widthCurrentUnit, digits)
    const heightCurrentUnitRounded = toFixedNumber(heightCurrentUnit, digits)

    const unitSelect = <select className="Select" value={unit} onChange={this.onUnitChange}>
      {this.props.percent ? <option value="percent">%</option> : undefined}
      <option value="px">px</option>
      <option value="mm">mm</option>
      <option value="inch">"</option>
    </select>

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
            <input className="TextInput" type="number" value={widthCurrentUnitRounded} step={step} min={1} onChange={this.onWidthChange} />
            {unitSelect}
          </div>
        </div>
        <div className="DimensionSelect_Row">
          <label>Height</label>
          <div className="DimensionSelect_Value">
            <input className="TextInput" type="number" value={heightCurrentUnitRounded} step={step} min={1} onChange={this.onHeightChange} />
            {unitSelect}
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
    const width = parseFloat((ev.target as HTMLInputElement).value)
    this.props.state.changeSizeCurrentUnit(width, undefined)
  }

  private onHeightChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const height = parseFloat((ev.target as HTMLInputElement).value)
    this.props.state.changeSizeCurrentUnit(undefined, height)
  }

  private onDpiChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const dpi = parseInt((ev.target as HTMLInputElement).value) || 72
    this.props.state.changeDpi(dpi)
  }

  private onKeepRatioToggle = (ev: React.FormEvent<HTMLInputElement>) => {
    this.props.state.keepRatio = (ev.target as HTMLInputElement).checked
  }
}
