import React = require("react")
import {observer} from "mobx-react"
import DialogContainer from "./DialogContainer"
import {KeyInputData} from "../../../lib/KeyInput"

interface ToolShortcutsDialogProps {
  onReadyShow: () => void
  onDone: (keyInputs?: [KeyInputData|undefined, KeyInputData|undefined]) => void
  init: [KeyInputData|undefined, KeyInputData|undefined]
}

@observer
export default
class ToolShortcutsDialog extends React.Component<ToolShortcutsDialogProps, {}> {
  render() {
    return (
      <DialogContainer title="Tool Shortcuts" okText="OK" canOK={true} onOK={this.onOK} onCancel={this.onCancel}>
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
    this.props.onDone()
  }
}
