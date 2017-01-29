import {actionRegistry} from "../app/ActionRegistry"
import {keyBindingRegistry} from "../app/KeyBindingRegistry"
import {toolManager} from "../app/ToolManager"

class KeyBindingHandler {
  pressedKeys = new Set<string>()

  constructor() {
    document.addEventListener("keydown", e => this.onKeyDown(e))
    document.addEventListener("keyup", e => this.onKeyUp(e))
    window.addEventListener("blur", e => this.onBlur())
  }

  onKeyDown(e: KeyboardEvent) {
    this.pressedKeys.add(e.key)

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
    for (const tool of toolManager.tools) {
      if (tool.shortcut && tool.shortcut.matchesEvent(e)) {
        toolManager.currentTool = tool
      }
      if (tool.tempShortcut && tool.tempShortcut.matchesKeys(this.pressedKeys)) {
        toolManager.overrideTool = tool
      }
    }
  }

  onKeyUp(e: KeyboardEvent) {
    this.pressedKeys.delete(e.key)
    const {overrideTool} = toolManager
    if (overrideTool) {
      if (!(overrideTool.tempShortcut && overrideTool.tempShortcut.matchesKeys(this.pressedKeys))) {
        toolManager.overrideTool = undefined
      }
    }
  }

  onBlur() {
    this.pressedKeys.clear()
  }
}

export
const keyBindingHandler = new KeyBindingHandler()
