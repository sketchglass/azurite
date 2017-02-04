import {actionRegistry} from "../app/ActionRegistry"
import {keyBindingRegistry} from "../app/KeyBindingRegistry"
import {toolManager} from "../app/ToolManager"

class KeyBindingHandler {
  pressedCodes = new Set<string>()

  constructor() {
    document.addEventListener("keydown", e => this.onKeyDown(e))
    document.addEventListener("keyup", e => this.onKeyUp(e))
    window.addEventListener("blur", e => this.onBlur())
  }

  onKeyDown(e: KeyboardEvent) {
    const keyBindings = keyBindingRegistry.keyBindingsForCode(e.key)
    for (const binding of keyBindings) {
      if (binding.keyInput.matchesEvent(e)) {
        const action = actionRegistry.actions.get(binding.action)
        if (action) {
          action.run()
          e.preventDefault()
          return
        }
      }
    }
    for (const tool of toolManager.tools) {
      if (tool.shortcut && tool.shortcut.matchesEvent(e)) {
        toolManager.currentTool = tool
        e.preventDefault()
        return
      }
    }
    this.pressedCodes.add(e.code)
    for (const tool of toolManager.tools) {
      if (tool.tempShortcut && tool.tempShortcut.matchesCodes(this.pressedCodes)) {
        toolManager.overrideTool = tool
      }
    }
  }

  onKeyUp(e: KeyboardEvent) {
    this.pressedCodes.delete(e.code)
    const {overrideTool} = toolManager
    if (overrideTool) {
      if (!(overrideTool.tempShortcut && overrideTool.tempShortcut.matchesCodes(this.pressedCodes))) {
        toolManager.overrideTool = undefined
      }
    }
  }

  onBlur() {
    this.pressedCodes.clear()
  }
}

export
const keyBindingHandler = new KeyBindingHandler()
