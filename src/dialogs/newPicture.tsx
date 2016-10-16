import React = require("react")
import ReactDOM = require("react-dom")
import {MAX_PICTURE_SIZE} from "../common/constants"
import * as IPCChannels from "../common/IPCChannels"
import {remote} from "electron"
import "./newPicture.sass"

interface NewPictureDialogState {
  width: number
  height: number
}

class NewPictureDialog extends React.Component<{}, NewPictureDialogState> {
  // TODO: save & load last dimension
  state = {
    width: 1200,
    height: 800,
  }
  dialog: HTMLDivElement

  componentDidMount() {
    const {width, height} = this.dialog.getBoundingClientRect()
    const win = remote.getCurrentWindow()
    win.setContentSize(width, height)
    win.show()
  }

  render() {
    const {width, height} = this.state

    return (
      <div className="NewPictureDialog" ref={e => this.dialog = e}>
        <div className="NewPictureDialog_Row">
          <label>Width</label>
          <input type="number" max={MAX_PICTURE_SIZE} value={width} onChange={this.onWidthChange.bind(this)} />
          <select>
            <option value="px">px</option>
            <option value="mm">mm</option>
          </select>
        </div>
        <div className="NewPictureDialog_Row">
          <label>Height</label>
          <input type="number" max={MAX_PICTURE_SIZE} value={height} onChange={this.onHeightChange.bind(this)} />
          <select>
            <option value="px">px</option>
            <option value="mm">mm</option>
          </select>
        </div>
        <div className="NewPictureDialog_Row">
          <label>Resolution</label>
          <input type="number" max={MAX_PICTURE_SIZE} value={72} />
          DPI
        </div>
        <button onClick={this.onOK.bind(this)}>OK</button>
      </div>
    )
  }

  onWidthChange(ev: Event) {
    const width = parseInt((ev.target as HTMLInputElement).value)
    const {height} = this.state
    this.setState({width, height})
  }

  onHeightChange(ev: Event) {
    const height = parseInt((ev.target as HTMLInputElement).value)
    const {width} = this.state
    this.setState({width, height})
  }

  onOK() {
    IPCChannels.newPictureDialogDone.send(this.state)
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<NewPictureDialog />, document.getElementById("app"))
})
