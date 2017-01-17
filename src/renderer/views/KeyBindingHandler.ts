import {actionRegistry} from "../app/ActionRegistry"
import {keyBindingRegistry} from "../app/KeyBindingRegistry"

class KeyBindingHandler {
  constructor() {
    document.addEventListener("keydown", e => this.onKeyDown(e))
  }

  onKeyDown(e: KeyboardEvent) {
    const keyBindings = keyBindingRegistry.keyBindingsForKey(e.key)
    for (const binding of keyBindings) {
      if (binding.keyInput.matchesEvent(e)) {
        const action = actionRegistry.actions.get(binding.action)
        if (action) {
          e.preventDefault()
          action.run()
        }
      }
    }
  }
}

export
const keyBindingHandler = new KeyBindingHandler()
