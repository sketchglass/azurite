import React = require("react")
import ReactDOM = require("react-dom")
import {MAX_PICTURE_SIZE} from "../common/constants"
import * as IPCChannels from "../common/IPCChannels"

interface SizeDialogState {
  width: number
  height: number
}

class SizeDialog extends React.Component<{}, SizeDialogState> {
  // TODO: save & load last dimension
  state = {
    width: 1200,
    height: 800,
  }

  render() {
    const {width, height} = this.state

    return (
      <div className="SizeDialog">
        <div>
          <label>Width</label>
          <input type="number" max={MAX_PICTURE_SIZE} value={width} onChange={this.onWidthChange.bind(this)} />
        </div>
        <div>
          <label>Height</label>
          <input type="number" max={MAX_PICTURE_SIZE} value={height} onChange={this.onHeightChange.bind(this)} />
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
    IPCChannels.sizeDialogDone.send(this.state)
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<SizeDialog />, document.getElementById("app"))
})
