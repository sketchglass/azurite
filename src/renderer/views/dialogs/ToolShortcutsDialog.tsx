import React = require('react')
import {observable} from 'mobx'
import {observer} from 'mobx-react'
import DialogContainer from './DialogContainer'
import KeyInput, {KeyInputData} from '../../../lib/KeyInput'
import ShortcutEdit from '../components/ShortcutEdit'

export interface ToolShortcutsDialogData {
  noTemp?: boolean
  toggle: KeyInputData|undefined
  temp: KeyInputData|undefined
}

interface ToolShortcutsDialogProps {
  onReadyShow: () => void
  onDone: (data?: ToolShortcutsDialogData) => void
  init: ToolShortcutsDialogData
}

@observer
export default
class ToolShortcutsDialog extends React.Component<ToolShortcutsDialogProps, {}> {
  @observable private toggle: KeyInput|undefined
  @observable private temp: KeyInput|undefined

  constructor(props: ToolShortcutsDialogProps) {
    super(props)
    const {toggle, temp} = this.props.init
    this.toggle = toggle && KeyInput.fromData(toggle)
    this.temp = temp && KeyInput.fromData(temp)
  }

  render() {
    return (
      <DialogContainer title="Tool Shortcuts" okText="OK" canOK={true} onOK={this.onOK} onCancel={this.onCancel}>
        <table>
          <tr>
            <td>Toggle</td>
            <td><ShortcutEdit shortcut={this.toggle} onChange={s => this.toggle = s} /></td>
          </tr>
          <tr hidden={this.props.init.noTemp}>
            <td>Temporary</td>
            <td><ShortcutEdit shortcut={this.temp} onChange={s => this.temp = s} /></td>
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
      toggle: this.toggle && this.toggle.toData(),
      temp: this.temp && this.temp.toData(),
    })
  }
}
