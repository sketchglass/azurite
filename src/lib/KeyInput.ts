const deepEqual = require("deep-equal")

function electronKeyNames(key: string) {
  switch (key) {
    case "Meta":
      return "Control"
    case "MetaOrControl":
      return "CommandOrControl"
    case "+":
      return "Plus"
    case " ":
      return "Space"
    default:
      if (key.match(/^[a-z]$/)) {
        return key.toUpperCase()
      }
      return key
  }
}

export
type KeyModifier = "Meta"|"Control"|"MetaOrControl"|"Alt"|"Shift"

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
    return [...this.modifiers, this.key].map(electronKeyNames).join("+")
  }

  matchesEvent(e: KeyboardEvent) {
    if (e.key == this.key) {
      const {modifiers} = this
      if (modifiers.includes("MetaOrControl")) {
        return (e.ctrlKey || e.metaKey) &&
          e.altKey == modifiers.includes("Alt") && e.shiftKey == modifiers.includes("Shift")
      } else {
        return e.ctrlKey == modifiers.includes("Control") && e.metaKey == modifiers.includes("Meta") &&
          e.altKey == modifiers.includes("Alt") && e.shiftKey == modifiers.includes("Shift")
      }
    } else {
      return false
    }
  }

  matchesKeys(keys: Iterable<string>) {
    for (const metaOrCtrl of ["Meta", "Control"]) {
      const modifiers = this.modifiers.map(m => m == "MetaOrControl" ? metaOrCtrl : m)
      const expected = [this.key, ...modifiers].sort()
      const actual = [...keys].sort()
      if (deepEqual(expected, actual)) {
        return true
      }
    }
    return false
  }
}
