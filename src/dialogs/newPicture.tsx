import React = require("react")
import ReactDOM = require("react-dom")
import {MAX_PICTURE_SIZE} from "../common/constants"
import * as IPCChannels from "../common/IPCChannels"
import {remote} from "electron"
import "./newPicture.sass"

type SizeUnits = "px" | "mm"

interface SizePresetPx {
  name: string
  unit: "px"
  widthPx: number
  heightPx: number
  dpi: number
}

interface SizePresetMm {
  name: string
  unit: "mm"
  widthMm: number
  heightMm: number
  dpi: number
}

type SizePreset = SizePresetPx | SizePresetMm

const sizePresets: SizePreset[] = [
  {
    name: "A4",
    unit: "mm",
    widthMm: 210,
    heightMm: 297,
    dpi: 144,
  },
  {
    name: "A5",
    unit: "mm",
    widthMm: 148,
    heightMm: 210,
    dpi: 144,
  },
  {
    name: "A6",
    unit: "mm",
    widthMm: 105,
    heightMm: 148,
    dpi: 144,
  },
  {
    name: "1200 x 800",
    unit: "px",
    widthPx: 1200,
    heightPx: 800,
    dpi: 144,
  }
]

function mmToPx(mm: number, dpi: number) {
  return Math.round(mm / 25.4 * dpi)
}

function pxToMm(px: number, dpi: number) {
  return Math.round(px / dpi * 25.4)
}

interface NewPictureDialogState {
  widthMm: number
  heightMm: number
  widthPx: number
  heightPx: number
  dpi: number
  unit: SizeUnits,
  ratio: number
  keepRatio: boolean
}

class NewPictureDialog extends React.Component<{}, NewPictureDialogState> {
  // TODO: save & load last dimension
  state = {
    widthMm: 0,
    heightMm: 0,
    widthPx: 0,
    heightPx: 0,
    dpi: 0,
    unit: "px" as SizeUnits,
    ratio: 1,
    keepRatio: true
  }
  dialog: HTMLFormElement

  currentPresetIndex() {
    const {widthPx, heightPx, widthMm, heightMm, dpi} = this.state
    for (const [i, preset] of sizePresets.entries()) {
      if (preset.unit == "px") {
        if (preset.widthPx == widthPx && preset.heightPx == heightPx && preset.dpi == dpi) {
          return i
        }
      } else {
        if (preset.widthMm == widthMm && preset.heightMm == heightMm && preset.dpi == dpi) {
          return i
        }
      }
    }
    return -1
  }

  componentDidMount() {
    this.setPreset(sizePresets[0])
    const {width, height} = this.dialog.getBoundingClientRect()
    const win = remote.getCurrentWindow()
    win.setContentSize(width, height)
    win.show()
  }

  render() {
    const {widthMm, heightMm, widthPx, heightPx, dpi, unit, keepRatio} = this.state
    const width = unit == "mm" ? widthMm : widthPx
    const height = unit == "mm" ? heightMm : heightPx

    return (
      <form className="NewPictureDialog" ref={e => this.dialog = e}>
        <div className="NewPictureDialog_Row">
          <label>Preset</label>
          <select value={this.currentPresetIndex()} autoFocus onChange={this.onPresetSelect}>
            {sizePresets.map((preset, i) => <option key={i} value={i}>{preset.name}</option>)}
            <option value={-1}>Custom</option>
          </select>
        </div>
        <div className="NewPictureDialog_Row">
          <label>Width</label>
          <div className="NewPictureDialog_Value">
            <input type="number" max={MAX_PICTURE_SIZE} value={width} onChange={this.onWidthChange} />
            <select value={unit} onChange={this.onUnitChange}>
              <option value="px">px</option>
              <option value="mm">mm</option>
            </select>
          </div>
        </div>
        <div className="NewPictureDialog_Row">
          <label>Height</label>
          <div className="NewPictureDialog_Value">
            <input type="number" max={MAX_PICTURE_SIZE} value={height} onChange={this.onHeightChange} />
            <select value={unit} onChange={this.onUnitChange}>
              <option value="px">px</option>
              <option value="mm">mm</option>
            </select>
          </div>
        </div>
        <div className="NewPictureDialog_Row">
          <label>Resolution</label>
          <div className="NewPictureDialog_Value">
            <input type="number" max={MAX_PICTURE_SIZE} value={dpi} onChange={this.onDpiChange} />
            DPI
          </div>
        </div>
        <div className="NewPictureDialog_Row">
          <label></label>
          <label>
            <input type="checkbox" checked={keepRatio} onChange={this.onKeepRatioToggle}/>
            Keep Ratio
          </label>
        </div>
        <button type="submit" onClick={this.onOK.bind(this)}>OK</button>
      </form>
    )
  }

  setPreset(preset: SizePreset) {
    if (preset.unit == "px") {
      const {widthPx, heightPx, dpi, unit} = preset
      this.setPx(widthPx, heightPx, dpi, unit, false)
    } else {
      const {widthMm, heightMm, dpi, unit} = preset
      this.setMm(widthMm, heightMm, dpi, unit, false)
    }
  }

  setMm(widthMm: number, heightMm: number, dpi: number, unit: SizeUnits, keepRatio: boolean) {
    const widthPx = mmToPx(widthMm, dpi)
    const heightPx = mmToPx(heightMm, dpi)
    const ratio = keepRatio ? this.state.ratio : heightMm / widthMm
    this.setState({widthPx, heightPx, widthMm, heightMm, dpi, ratio, unit} as NewPictureDialogState)
  }

  setPx(widthPx: number, heightPx: number, dpi: number, unit: SizeUnits, keepRatio: boolean) {
    const widthMm = pxToMm(widthPx, dpi)
    const heightMm = pxToMm(heightPx, dpi)
    const ratio = keepRatio ? this.state.ratio : heightPx / widthPx
    this.setState({widthPx, heightPx, widthMm, heightMm, dpi, ratio, unit} as NewPictureDialogState)
  }

  onPresetSelect = (ev: React.FormEvent<HTMLSelectElement>) => {
    const i = parseInt((ev.target as HTMLSelectElement).value)
    if (i >= 0) {
      this.setPreset(sizePresets[i])
    }
  }

  onUnitChange = (ev: React.FormEvent<HTMLSelectElement>) => {
    const unit = (ev.target as HTMLSelectElement).value
    this.setState({unit} as NewPictureDialogState)
  }

  onWidthChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const width = parseInt((ev.target as HTMLInputElement).value)
    const {unit, dpi, keepRatio} = this.state
    if (unit == "mm") {
      const height = keepRatio ? Math.round(width * this.state.ratio) : this.state.heightMm
      this.setMm(width, height, dpi, unit, keepRatio)
    } else {
      const height = keepRatio ? Math.round(width * this.state.ratio) : this.state.heightPx
      this.setPx(width, height, dpi, unit, keepRatio)
    }
  }

  onHeightChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const height = parseInt((ev.target as HTMLInputElement).value)
    const {unit, dpi, keepRatio} = this.state
    if (unit == "mm") {
      const width = this.state.keepRatio ? Math.round(height / this.state.ratio) : this.state.widthMm
      this.setMm(width, height, dpi, unit, keepRatio)
    } else {
      const width = this.state.keepRatio ? Math.round(height / this.state.ratio) : this.state.widthPx
      this.setPx(width, height, dpi, unit, keepRatio)
    }
  }

  onDpiChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const dpi = parseInt((ev.target as HTMLInputElement).value) || 72
    const {unit, keepRatio} = this.state
    if (unit == "mm") {
      const {widthMm, heightMm} = this.state
      this.setMm(widthMm, heightMm, dpi, unit, keepRatio)
    } else {
      const {widthPx, heightPx} = this.state
      this.setPx(widthPx, heightPx, dpi, unit, keepRatio)
    }
  }

  onKeepRatioToggle = () => {
    this.setState({keepRatio: !this.state.keepRatio} as NewPictureDialogState)
  }

  onOK() {
    const {widthPx, heightPx} = this.state
    IPCChannels.newPictureDialogDone.send({width: widthPx, height: heightPx})
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<NewPictureDialog />, document.getElementById("app"))
})
