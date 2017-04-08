import {action} from 'mobx'
import {actionRegistry} from '../app/ActionRegistry'
import {keyBindingRegistry} from '../app/KeyBindingRegistry'
import {toolManager} from '../app/ToolManager'
import {brushPresetManager} from '../app/BrushPresetManager'
import KeyInput from '../../lib/KeyInput'
import KeyRecorder from '../../lib/KeyRecorder'
import BrushTool from '../tools/BrushTool'

class KeyBindingHandler {
  private keyRecorder = new KeyRecorder()

  constructor() {
    document.addEventListener('keydown', e => this.onKeyDown(e))
    document.addEventListener('keyup', e => this.onKeyUp(e))
    window.addEventListener('blur', e => this.onBlur())
  }

  @action private onKeyDown(e: KeyboardEvent) {
    const keyBindings = keyBindingRegistry.keyBindingsForCode(e.key)
    const keyInput = KeyInput.fromEvent(e)
    for (const binding of keyBindings) {
      if (binding.keyInput.equals(keyInput)) {
        const action = actionRegistry.actions.get(binding.action)
        if (action) {
          action.run()
          e.preventDefault()
          return
        }
      }
    }
    for (const tool of toolManager.tools) {
      if (tool.toggleShortcut && tool.toggleShortcut.equals(keyInput)) {
        toolManager.currentTool = tool
        e.preventDefault()
        return
      }
    }
    const brushTool = toolManager.tools.find(t => t instanceof BrushTool)
    for (const [index, brush] of brushPresetManager.presets.entries()) {
      if (brush.shortcut && brush.shortcut.equals(keyInput)) {
        toolManager.currentTool = brushTool
        brushPresetManager.currentPresetIndex = index
        e.preventDefault()
        return
      }
    }
    this.keyRecorder.keyDown(e)
    this.updateOverrideTool()
  }

  @action private onKeyUp(e: KeyboardEvent) {
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
