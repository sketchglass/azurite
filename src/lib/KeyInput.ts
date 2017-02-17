const deepEqual = require("deep-equal")
const keyboardLayout = require("keyboard-layout")

function electronKeyNames(code: string) {
  switch (code) {
    case "Meta":
      return "Command"
    case "MetaOrControl":
      return "CommandOrControl"
    case "Space":
      return "Space"
    case "ArrowUp":
      return "Up"
    case "ArrowDown":
      return "Down"
    case "ArrowLeft":
      return "Left"
    case "ArrowRight":
      return "Right"
  }
  const keymap = keyboardLayout.getCurrentKeymap()
  if (code in keymap) {
    const key = keymap[code].unmodified
    switch (key) {
      case "+":
        return "Plus"
      default:
        return key
    }
  }
  return code
}

export
type KeyModifier = "Meta"|"Control"|"MetaOrControl"|"Alt"|"Shift"

export
const allModifiers: KeyModifier[] = ["Meta", "Control", "MetaOrControl", "Alt", "Shift"]

export
interface KeyInputData {
  modifiers: KeyModifier[]
  code: string
}

// TODO: make sure to work in non-US keyboards
export default
class KeyInput {
  constructor(public modifiers: KeyModifier[], public code: string) {
  }

  static fromData(data: KeyInputData) {
    return new KeyInput(data.modifiers, data.code)
  }

  static fromEvent(e: KeyboardEvent) {
    const modifiers = allModifiers.filter(m => e.getModifierState(m))
    return new KeyInput(modifiers, e.code)
  }

  toData(): KeyInputData {
    const {modifiers, code} = this
    return {modifiers, code}
  }

  toElectronAccelerator() {
    return [...this.modifiers, this.code].map(electronKeyNames).join("+")
  }

  equals(other: KeyInput) {
    if (this.code == other.code) {
      for (const metaOrCtrl of ["Meta", "Control"]) {
        const normalizeModifiers = (modifiers: KeyModifier[]) => modifiers.map(m => m == "MetaOrControl" ? metaOrCtrl : m).sort()
        if (deepEqual(normalizeModifiers(this.modifiers), normalizeModifiers(other.modifiers))) {
          return true
        }
      }
    }
    return false
  }
}
