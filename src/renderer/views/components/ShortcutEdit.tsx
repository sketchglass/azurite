import * as React from 'react'
import KeyInput from '../../../lib/KeyInput'
import KeyRecorder from '../../../lib/KeyRecorder'
import './ShortcutEdit.css'

interface ShortcutEditProps {
  shortcut: KeyInput|undefined
  onChange: (shortcut: KeyInput|undefined) => void
}

export default
class ShortcutEdit extends React.Component<ShortcutEditProps, {}> {
  private keyRecorder = new KeyRecorder()

  render() {
    const {shortcut} = this.props
    return (
      <div className="ShortcutEdit" tabIndex={-1} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} >
        {shortcut ? shortcut.toElectronAccelerator() : ''}
        <div className="ShortcutEdit_clear" onClick={this.onClear} />
      </div>
    )
  }

  private onClear = () => {
    this.props.onChange(undefined)
    this.keyRecorder.clear()
  }

  private onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    e.preventDefault()
    this.keyRecorder.keyDown(e.nativeEvent as KeyboardEvent)
    this.props.onChange(this.keyRecorder.keyInput)
  }

  private onKeyUp = (e: React.KeyboardEvent<HTMLElement>) => {
    e.preventDefault()
    this.keyRecorder.keyUp(e.nativeEvent as KeyboardEvent)
  }
}
