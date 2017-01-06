import {actionRegistry} from "../state/ActionRegistry"
import {keyBindingRegistry} from "../state/KeyBindingRegistry"

class KeyBindingHandler {
  constructor() {
    document.addEventListener("keydown", e => this.onKeyDown(e))
  }

  onKeyDown(e: KeyboardEvent) {
    console.log("keydown")
    const keyBindings = keyBindingRegistry.keyBindingsForKey(e.key)
    console.log(keyBindings)
    for (const binding of keyBindings) {
      if (binding.keyInput.matchesEvent(e)) {
        const action = actionRegistry.actions.get(binding.action)
        if (action) {
          e.preventDefault()
          console.log("executing", binding.action)
          action.run()
        }
      }
    }
  }
}

export
const keyBindingHandler = new KeyBindingHandler()
