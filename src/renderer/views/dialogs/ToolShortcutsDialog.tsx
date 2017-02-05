import React = require("react")
import {observable} from "mobx"
import {observer} from "mobx-react"
import DialogContainer from "./DialogContainer"
import KeyInput, {KeyInputData} from "../../../lib/KeyInput"
import ShortcutEdit from "../components/ShortcutEdit"

export interface ToolShortcutsDialogData {
  shortcut: KeyInputData|undefined
  tempShortcut: KeyInputData|undefined
}

interface ToolShortcutsDialogProps {
  onReadyShow: () => void
  onDone: (data?: ToolShortcutsDialogData)=> void
  init: ToolShortcutsDialogData
}

@observer
export default
class ToolShortcutsDialog extends React.Component<ToolShortcutsDialogProps, {}> {
  @observable private shortcut: KeyInput|undefined
  @observable private tempShortcut: KeyInput|undefined

  constructor(props: ToolShortcutsDialogProps) {
    super(props)
    const {shortcut, tempShortcut} = this.props.init
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
    this.props.onDone({
      shortcut: this.shortcut && this.shortcut.toData(),
      tempShortcut: this.tempShortcut && this.tempShortcut.toData(),
    })
  }
}
