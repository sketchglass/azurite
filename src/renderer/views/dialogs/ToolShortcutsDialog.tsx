import React = require("react")
import {observable} from "mobx"
import {observer} from "mobx-react"
import DialogContainer from "./DialogContainer"
import KeyInput, {KeyInputData} from "../../../lib/KeyInput"
import ShortcutEdit from "../components/ShortcutEdit"

interface ToolShortcutsDialogProps {
  onReadyShow: () => void
  onDone: (keyInputs?: [KeyInputData|undefined, KeyInputData|undefined]) => void
  init: [KeyInputData|undefined, KeyInputData|undefined]
}

@observer
export default
class ToolShortcutsDialog extends React.Component<ToolShortcutsDialogProps, {}> {
  @observable shortcut: KeyInput|undefined
  @observable tempShortcut: KeyInput|undefined

  constructor(props: ToolShortcutsDialogProps) {
    super(props)
    const [shortcut, tempShortcut] = this.props.init
    this.shortcut = shortcut && KeyInput.fromData(shortcut)
    this.tempShortcut = tempShortcut && KeyInput.fromData(tempShortcut)
  }

  render() {
    return (
      <DialogContainer title="Tool Shortcuts" okText="OK" canOK={true} onOK={this.onOK} onCancel={this.onCancel}>
        <table>
          <tr>
            <td>Shortcut</td>
            <td><ShortcutEdit shortcut={this.shortcut} onChange={s => this.shortcut = s} /></td>
          </tr>
          <tr>
            <td>Temp Shortcut</td>
            <td><ShortcutEdit shortcut={this.tempShortcut} onChange={s => this.tempShortcut = s} /></td>
          </tr>
        </table>
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
