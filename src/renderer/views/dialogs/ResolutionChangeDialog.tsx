import {observer} from 'mobx-react'
import React = require('react')
import {PictureDimension} from '../../models/Picture'
import DimensionSelectViewModel from '../../viewmodels/DimensionSelectViewModel'
import DimensionSelect from '../DimensionSelect'
import DialogContainer from './DialogContainer'

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
    this.dimensionSelectViewModel.unit = 'percent'
  }

  render() {
    return (
      <DialogContainer title='Change Canvas Resolution' okText='Change' canOK={this.dimensionSelectViewModel.isValid} onOK={this.onOK} onCancel={this.onCancel}>
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
