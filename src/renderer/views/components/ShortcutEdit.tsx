import * as React from "react"
import KeyInput, {KeyModifier} from "../../../lib/KeyInput"

interface ShortcutEditProps {
  shortcut: KeyInput|undefined
  onChange: (shortcut: KeyInput|undefined) => void
}

export default
class ShortcutEdit extends React.Component<ShortcutEditProps, {}> {
  private modifiers = new Set<KeyModifier>()
  private key: string|undefined

  render() {
    const {shortcut} = this.props
    return (
      <div className="ShortcutEdit" tabIndex={-1} onKeyDown={this.onKeyDown} onFocus={this.onFocus} >
        {shortcut ? shortcut.toElectronAccelerator() : ""}
      </div>
    )
  }

  private onFocus = () => {
    this.modifiers.clear()
    this.key = undefined
  }

  private onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const {key} = e
    if (this.key == undefined) {
      this.key = key
    } else if (key == "Control" || key == "Meta" || key == "Alt" || key == "Shift") {
      this.modifiers.add(key)
    } else {
      this.key = key
    }
    if (this.key) {
      const shortcut = new KeyInput([...this.modifiers], this.key)
      this.props.onChange(shortcut)
    }
    e.preventDefault()
  }
}
