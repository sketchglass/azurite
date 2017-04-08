import KeyInput, {KeyModifier, allModifiers} from './KeyInput'

export default
class KeyRecorder {
  pressedCode: string|undefined
  pressedModifiers = new Set<KeyModifier>()

  get keyInput() {
    if (this.pressedCode) {
      return new KeyInput([...this.pressedModifiers], this.pressedCode)
    }
  }

  clear() {
    this.pressedCode = undefined
    this.pressedModifiers.clear()
  }

  keyDown(e: KeyboardEvent) {
    if (allModifiers.includes(e.key as KeyModifier) && this.pressedCode != undefined && !allModifiers.includes(this.pressedCode as KeyModifier)) {
      this.pressedModifiers.add(e.key as KeyModifier)
      console.log('add modifier', e.key)
    } else {
      this.clear()
      this.pressedCode = e.code
      if (!allModifiers.includes(e.key as KeyModifier)) {
        this.pressedModifiers = new Set(allModifiers.filter(m => e.getModifierState(m)))
      }
      console.log('down', this.pressedCode, this.pressedModifiers)
    }
  }

  keyUp(e: KeyboardEvent) {
    if (this.pressedModifiers.has(e.key as KeyModifier)) {
      this.pressedModifiers.delete(e.key as KeyModifier)
      console.log('remove modifier', e.key)
    } else {
      this.pressedCode = undefined
      console.log('up', e.code)
    }
  }
}
