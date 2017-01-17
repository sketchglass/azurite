import React = require("react")
import {observer} from "mobx-react"
import {PictureDimension} from "../../models/Picture"
import DimensionSelect from "../DimensionSelect"
import DimensionSelectViewModel from "../../viewmodels/DimensionSelectViewModel"
import DialogContainer from "./DialogContainer"

interface ResolutionChangeDialogProps {
  init: PictureDimension
  onReadyShow: () => void
  onDone: (dimension?: PictureDimension) => void
}

@observer
export default
class ResolutionChangeDialog extends React.Component<ResolutionChangeDialogProps, {}> {
  private dimensionSelectViewModel: DimensionSelectViewModel

  constructor(props: ResolutionChangeDialogProps) {
    super(props)
    this.dimensionSelectViewModel = new DimensionSelectViewModel(props.init)
    this.dimensionSelectViewModel.unit = "percent"
  }

  render() {
    return (
      <DialogContainer okText="Change" canOK={this.dimensionSelectViewModel.isValid} onOK={this.onOK} onCancel={this.onCancel}>
        <DimensionSelect viewModel={this.dimensionSelectViewModel} percent={true}/>
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
    this.props.onDone(this.dimensionSelectViewModel.dimension)
  }
}
