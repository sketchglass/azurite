import React = require('react')
import {observer} from 'mobx-react'
import {PictureDimension} from '../../models/Picture'
import DimensionSelect from '../DimensionSelect'
import DimensionSelectViewModel from '../../viewmodels/DimensionSelectViewModel'
import DialogContainer from './DialogContainer'

interface NewPictureDialogProps {
  onReadyShow: () => void
  onDone: (dimension?: PictureDimension) => void
}

@observer
export default
class NewPictureDialog extends React.Component<NewPictureDialogProps, {}> {
  private dimensionSelectViewModel = new DimensionSelectViewModel()

  render() {
    return (
      <DialogContainer title="New Picture" okText="New" canOK={this.dimensionSelectViewModel.isValid} onOK={this.onOK} onCancel={this.onCancel}>
        <DimensionSelect viewModel={this.dimensionSelectViewModel} />
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
