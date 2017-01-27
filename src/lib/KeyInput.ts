
export
type KeyModifier = "Command"|"Control"|"CommandOrControl"|"Alt"|"Shift"

export
interface KeyInputData {
  modifiers: KeyModifier[]
  key: string
}

export default
class KeyInput {
  constructor(public modifiers: KeyModifier[], public key: string) {
  }

  static fromData(data: KeyInputData) {
    return new KeyInput(data.modifiers, data.key)
  }

  toData(): KeyInputData {
    const {modifiers, key} = this
    return {modifiers, key}
  }

  toElectronAccelerator() {
    let key = this.key
    if (key.length == 1) {
      key = key.toUpperCase()
    }
    if (key == "+") {
      key = "Plus"
    }
    return [...this.modifiers, key].join("+")
  }

  matchesEvent(e: KeyboardEvent) {
    if (e.key == this.key) {
      const {modifiers} = this
      if (modifiers.includes("CommandOrControl")) {
        return (e.ctrlKey || e.metaKey) &&
          e.altKey == modifiers.includes("Alt") && e.shiftKey == modifiers.includes("Shift")
      } else {
        return e.ctrlKey == modifiers.includes("Control") && e.metaKey == modifiers.includes("Command") &&
          e.altKey == modifiers.includes("Alt") && e.shiftKey == modifiers.includes("Shift")
      }
    } else {
      return false
    }
  }
}
