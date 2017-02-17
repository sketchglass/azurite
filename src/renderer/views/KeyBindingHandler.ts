import {actionRegistry} from "../app/ActionRegistry"
import {keyBindingRegistry} from "../app/KeyBindingRegistry"
import {toolManager} from "../app/ToolManager"
import KeyInput from "../../lib/KeyInput"
import KeyRecorder from "../../lib/KeyRecorder"

class KeyBindingHandler {
  private keyRecorder = new KeyRecorder()

  constructor() {
    document.addEventListener("keydown", e => this.onKeyDown(e))
    document.addEventListener("keyup", e => this.onKeyUp(e))
    window.addEventListener("blur", e => this.onBlur())
  }

  private onKeyDown(e: KeyboardEvent) {
    const keyBindings = keyBindingRegistry.keyBindingsForCode(e.key)
    for (const binding of keyBindings) {
      if (binding.keyInput.equals(KeyInput.fromEvent(e))) {
        const action = actionRegistry.actions.get(binding.action)
        if (action) {
          action.run()
          e.preventDefault()
          return
        }
      }
    }
    for (const tool of toolManager.tools) {
      if (tool.toggleShortcut && tool.toggleShortcut.equals(KeyInput.fromEvent(e))) {
        toolManager.currentTool = tool
        e.preventDefault()
        return
      }
    }
    this.keyRecorder.keyDown(e)
    this.updateOverrideTool()
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keyRecorder.keyUp(e)
    this.updateOverrideTool()
  }

  private onBlur() {
    this.keyRecorder.clear()
  }

  private updateOverrideTool() {
    const {keyInput} = this.keyRecorder
    if (keyInput) {
      for (const tool of toolManager.tools) {
        if (tool.tempShortcut && tool.tempShortcut.equals(keyInput)) {
          toolManager.overrideTool = tool
          return
        }
      }
    }
    toolManager.overrideTool = undefined
  }
}

export
const keyBindingHandler = new KeyBindingHandler()
