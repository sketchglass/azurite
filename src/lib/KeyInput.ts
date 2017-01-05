
type KeyModifier = "Command"|"Control"|"CommandOrControl"|"Alt"|"Shift"

export default
class KeyInput {
  constructor(public modifiers: KeyModifier[], public key: string) {
  }
}
