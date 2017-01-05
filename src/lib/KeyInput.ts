
type KeyModifier = "Command"|"Control"|"CommandOrControl"|"Alt"|"Shift"

export default
class KeyInput {
  constructor(public modifiers: KeyModifier[], public key: string) {
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
}
