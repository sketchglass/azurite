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
  unit: SizeUnits
}

class NewPictureDialog extends React.Component<{}, NewPictureDialogState> {
  // TODO: save & load last dimension
  state = {
    widthMm: 0,
    heightMm: 0,
    widthPx: 0,
    heightPx: 0,
    dpi: 0,
    unit: "px" as SizeUnits
  }
  dialog: HTMLDivElement

  componentDidMount() {
    this.setPreset(sizePresets[0])
    const {width, height} = this.dialog.getBoundingClientRect()
    const win = remote.getCurrentWindow()
    win.setContentSize(width, height)
    win.show()
  }

  render() {
    const {widthMm, heightMm, widthPx, heightPx, dpi, unit} = this.state
    const width = unit == "mm" ? widthMm : widthPx
    const height = unit == "mm" ? heightMm : heightPx

    return (
      <form className="NewPictureDialog" ref={e => this.dialog = e}>
        <div className="NewPictureDialog_Row">
          <label>Width</label>
          <select onChange={this.onPresetSelect}>{
            sizePresets.map((preset, i) => <option value={i}>{preset.name}</option>)
          }</select>
        </div>
        <div className="NewPictureDialog_Row">
          <label>Width</label>
          <input type="number" max={MAX_PICTURE_SIZE} value={width} onChange={this.onWidthChange} />
          <select value={unit} onChange={this.onUnitChange}>
            <option value="px">px</option>
            <option value="mm">mm</option>
          </select>
        </div>
        <div className="NewPictureDialog_Row">
          <label>Height</label>
          <input type="number" max={MAX_PICTURE_SIZE} value={height} onChange={this.onHeightChange} />
          <select value={unit} onChange={this.onUnitChange}>
            <option value="px">px</option>
            <option value="mm">mm</option>
          </select>
        </div>
        <div className="NewPictureDialog_Row">
          <label>Resolution</label>
          <input type="number" max={MAX_PICTURE_SIZE} value={dpi} onChange={this.onDpiChange} />
          DPI
        </div>
        <button type="submit" onClick={this.onOK.bind(this)}>OK</button>
      </form>
    )
  }

  setPreset(preset: SizePreset) {
    if (preset.unit == "px") {
      const {widthPx, heightPx, dpi, unit} = preset
      const widthMm = pxToMm(widthPx, dpi)
      const heightMm = pxToMm(heightPx, dpi)
      this.setState({widthPx, heightPx, widthMm, heightMm, dpi, unit} as NewPictureDialogState)
    } else {
      const {widthMm, heightMm, dpi, unit} = preset
      const widthPx = mmToPx(widthMm, dpi)
      const heightPx = mmToPx(heightMm, dpi)
      this.setState({widthPx, heightPx, widthMm, heightMm, dpi, unit} as NewPictureDialogState)
    }
  }

  onPresetSelect = (ev: React.FormEvent<HTMLSelectElement>) => {
    const i = parseInt((ev.target as HTMLSelectElement).value)
    this.setPreset(sizePresets[i])
  }

  onUnitChange = (ev: React.FormEvent<HTMLSelectElement>) => {
    const unit = (ev.target as HTMLSelectElement).value
    this.setState({unit} as NewPictureDialogState)
  }

  onWidthChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const width = parseInt((ev.target as HTMLInputElement).value)
    const {unit, dpi} = this.state
    if (unit == "mm") {
      const widthPx = mmToPx(width, dpi)
      this.setState({widthMm: width, widthPx} as NewPictureDialogState)
    } else {
      const widthMm = pxToMm(width, dpi)
      this.setState({widthMm, widthPx: width} as NewPictureDialogState)
    }
  }

  onHeightChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const height = parseInt((ev.target as HTMLInputElement).value)
    const {unit, dpi} = this.state
    if (unit == "mm") {
      const heightPx = mmToPx(height, dpi)
      this.setState({heightMm: height, heightPx} as NewPictureDialogState)
    } else {
      const heightMm = pxToMm(height, dpi)
      this.setState({heightMm, heightPx: height} as NewPictureDialogState)
    }
  }

  onDpiChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const dpi = parseInt((ev.target as HTMLInputElement).value) || 72
    const {unit} = this.state
    if (unit == "mm") {
      const {widthMm, heightMm} = this.state
      const widthPx = mmToPx(widthMm, dpi)
      const heightPx = mmToPx(heightMm, dpi)
      this.setState({dpi, widthPx, heightPx} as NewPictureDialogState)
    } else {
      const {widthPx, heightPx} = this.state
      const widthMm = pxToMm(widthPx, dpi)
      const heightMm = pxToMm(heightPx, dpi)
      this.setState({dpi, widthMm, heightMm} as NewPictureDialogState)
    }
  }

  onOK() {
    const {widthPx, heightPx} = this.state
    IPCChannels.newPictureDialogDone.send({width: widthPx, height: heightPx})
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<NewPictureDialog />, document.getElementById("app"))
})
