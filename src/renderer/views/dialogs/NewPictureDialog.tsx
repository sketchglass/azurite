import React = require("react")
import {observer} from "mobx-react"
import {PictureDimension} from "../../models/Picture"
import DimensionSelect from "../DimensionSelect"
import DimensionSelectState from "../../state/DimensionSelectState"
import DialogContainer from "./DialogContainer"

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
      <DialogContainer okText="New" canOK={this.dimensionSelectState.isValid} onOK={this.onOK} onCancel={this.onCancel}>
        <DimensionSelect state={this.dimensionSelectState} />
      </DialogContainer>
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
