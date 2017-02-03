import * as React from "react"
import KeyInput, {KeyModifier} from "../../../lib/KeyInput"

interface ShortcutEditProps {
  shortcut: KeyInput|undefined
  onChange: (shortcut: KeyInput|undefined) => void
}

export default
class ShortcutEdit extends React.Component<ShortcutEditProps, {}> {
  render() {
    const {shortcut} = this.props
    return (
      <div className="ShortcutEdit" tabIndex={-1} onKeyDown={this.onKeyDown} onFocus={this.onFocus} >
        {shortcut ? shortcut.toElectronAccelerator() : ""}
      </div>
    )
  }

  private onFocus = () => {
    this.props.onChange(undefined)
  }

  private onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    e.preventDefault()
    const {key} = e
    const modifiers = new Set<KeyModifier>()
    if (!["Shift", "Alt", "Control", "Meta"].includes(key)) {
      e.shiftKey && modifiers.add("Shift")
      e.altKey && modifiers.add("Alt")
      e.ctrlKey && modifiers.add("Control")
      e.metaKey && modifiers.add("Meta")
    }
    const shortcut = new KeyInput([...modifiers], key)
    this.props.onChange(shortcut)
  }
}
