import React = require("react")
import ReactDOM = require("react-dom")
import {observer} from "mobx-react"
import {PictureDimension} from "../../models/Picture"
import DimensionSelect from "../DimensionSelect"
import DimensionSelectState from "../../state/DimensionSelectState"

interface NewPictureDialogProps {
  onReadyShow: () => void
  onDone: (dimension?: PictureDimension) => void
}

@observer
export default
class NewPictureDialog extends React.Component<NewPictureDialogProps, {}> {
  private dimensionSelectState = new DimensionSelectState()

  render() {
    return (
      <div className="NewPictureDialog">
        <DimensionSelect state={this.dimensionSelectState} />
        <div className="NewPictureDialog_buttons">
          <button className="Button" onClick={this.onCancel}>Cancel</button>
          <button className="Button Button-primary" onClick={this.onOK} disabled={!this.dimensionSelectState.isValid}>New</button>
        </div>
      </div>
    )
  }

  componentDidMount() {
    this.props.onReadyShow()
  }

  private onCancel = () => {
    this.props.onDone()
  }

  private onOK = () => {
    this.props.onDone(this.dimensionSelectState.dimension)
  }
}
