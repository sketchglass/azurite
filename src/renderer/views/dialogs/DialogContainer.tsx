import * as React from 'react'
import DialogTitleBar from '../components/DialogTitleBar'
import './DialogContainer.css'

interface DialogContainerProps {
  title: string
  okText: string
  canOK: boolean
  onOK: () => void
  onCancel: () => void
}

export default
class DialogContainer extends React.Component<DialogContainerProps, {}> {
  render() {
    return (
      <div className="DialogContainer">
        {process.platform === 'win32' ? <DialogTitleBar title={this.props.title} /> : undefined}
        <div className="DialogContainer_content">
          {this.props.children}
          <div className="DialogContainer_buttons">
            <button className="Button" onClick={this.props.onCancel}>Cancel</button>
            <button className="Button Button-primary" onClick={this.props.onOK} disabled={!this.props.canOK}>{this.props.okText}</button>
          </div>
        </div>
      </div>
    )
  }

  componentDidMount() {
    document.addEventListener('keyup', this.onKeyUp)
  }
  componentWillUnmount() {
    document.removeEventListener('keyup', this.onKeyUp)
  }

  onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      this.props.onOK()
    }
    if (e.key === 'Escape') {
      this.props.onCancel()
    }
  }
}
