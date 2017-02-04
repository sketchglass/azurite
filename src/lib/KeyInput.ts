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

  toData(): KeyInputData {
    const {modifiers, code} = this
    return {modifiers, code}
  }

  toElectronAccelerator() {
    return [...this.modifiers, this.code].map(electronKeyNames).join("+")
  }

  matchesEvent(e: KeyboardEvent) {
    if (e.code == this.code) {
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

  matchesCodes(codes: Iterable<string>) {
    for (const metaOrCtrl of ["Meta", "Control"]) {
      const modifiers = this.modifiers.map(m => m == "MetaOrControl" ? metaOrCtrl : m)
      const expected = [this.code, ...modifiers].sort()
      const actual = [...codes].sort()
      if (deepEqual(expected, actual)) {
        return true
      }
    }
    return false
  }
}
