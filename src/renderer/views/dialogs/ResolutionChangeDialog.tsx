import React = require("react")
import {observer} from "mobx-react"
import {PictureDimension} from "../../models/Picture"
import DimensionSelect from "../DimensionSelect"
import DimensionSelectState from "../../state/DimensionSelectState"
import DialogContainer from "./DialogContainer"

interface ResolutionChangeDialogProps {
  init: PictureDimension
  onReadyShow: () => void
  onDone: (dimension?: PictureDimension) => void
}

@observer
export default
class ResolutionChangeDialog extends React.Component<ResolutionChangeDialogProps, {}> {
  private dimensionSelectState: DimensionSelectState

  constructor(props: ResolutionChangeDialogProps) {
    super(props)
    this.dimensionSelectState = new DimensionSelectState(props.init)
    this.dimensionSelectState.unit = "percent"
  }

  render() {
    return (
      <DialogContainer okText="Change" canOK={this.dimensionSelectState.isValid} onOK={this.onOK} onCancel={this.onCancel}>
        <DimensionSelect state={this.dimensionSelectState} percent={true}/>
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
