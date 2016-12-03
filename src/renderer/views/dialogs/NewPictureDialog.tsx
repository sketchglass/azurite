import React = require("react")
import ReactDOM = require("react-dom")
import {observer} from "mobx-react"
import {PictureDimension} from "../../models/Picture"
import DimensionSelect from "../DimensionSelect"
import DimensionSelectState from "../../state/DimensionSelectState"

interface NewPictureDialogProps {
  onReadyShow: () => void
  onOK: (dimension: PictureDimension) => void
}

@observer
export default
class NewPictureDialog extends React.Component<NewPictureDialogProps, {}> {
  private dimensionSelectState = new DimensionSelectState()

  render() {
    return (
      <div className="NewPictureDialog">
        <DimensionSelect state={this.dimensionSelectState} />
        <button className="Button Button-primary" type="submit" onClick={this.onOK} disabled={!this.dimensionSelectState.isValid}>OK</button>
      </div>
    )
  }

  componentDidMount() {
    this.props.onReadyShow()
  }

  private onDimensionChange = (dim: PictureDimension, isValid: boolean) => {
    this.setState({isValid})
  }

  private onOK = () => {
    this.props.onOK(this.dimensionSelectState.dimension)
  }
}
