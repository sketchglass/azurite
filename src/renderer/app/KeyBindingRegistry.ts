import KeyInput from '../../lib/KeyInput'
import ActionIDs from '../actions/ActionIDs'

interface KeyBinding {
  action: string
  keyInput: KeyInput
}

export default
class KeyBindingRegistry {
  keyBindings = new Map<string, KeyBinding>()
  codeToKeyBindings = new Map<string, KeyBinding[]>()

  keyInputForAction(id: string) {
    const keyBinding = this.keyBindings.get(id)
    if (keyBinding) {
      return keyBinding.keyInput
    }
  }

  keyBindingsForCode(code: string) {
    return this.codeToKeyBindings.get(code) || []
  }

  add(...keyBindings: [string, KeyInput][]) {
    for (const [action, keyInput] of keyBindings) {
      const keyBinding = {action, keyInput}
      this.keyBindings.set(action, keyBinding)
      if (this.codeToKeyBindings.has(keyInput.code)) {
        this.codeToKeyBindings.get(keyInput.code)!.push(keyBinding)
      } else {
        this.codeToKeyBindings.set(keyInput.code, [keyBinding])
      }
    }
  }
}

export const keyBindingRegistry = new KeyBindingRegistry()

keyBindingRegistry.add(
  [ActionIDs.fileNew, new KeyInput(['MetaOrControl'], 'KeyN')],
  [ActionIDs.fileOpen, new KeyInput(['MetaOrControl'], 'KeyO')],
  [ActionIDs.fileSave, new KeyInput(['MetaOrControl'], 'KeyS')],
  [ActionIDs.fileSaveAs, new KeyInput(['MetaOrControl', 'Shift'], 'KeyS')],
  [ActionIDs.fileClose, new KeyInput(['MetaOrControl'], 'KeyW')],

  [ActionIDs.editUndo, new KeyInput(['MetaOrControl'], 'KeyZ')],
  [ActionIDs.editRedo, process.platform === 'darwin' ? new KeyInput(['Shift', 'Meta'], 'KeyZ') : new KeyInput(['Control'], 'KeyY')],
  [ActionIDs.editCut, new KeyInput(['MetaOrControl'], 'KeyX')],
  [ActionIDs.editCopy, new KeyInput(['MetaOrControl'], 'KeyC')],
  [ActionIDs.editPaste, new KeyInput(['MetaOrControl'], 'KeyV')],

  [ActionIDs.selectionSelectAll, new KeyInput(['MetaOrControl'], 'KeyA')],
  [ActionIDs.selectionClear, new KeyInput(['MetaOrControl'], 'KeyD')],
  [ActionIDs.selectionInvert, new KeyInput(['Shift', 'MetaOrControl'], 'KeyI')],

  [ActionIDs.layerAdd, new KeyInput(['MetaOrControl', 'Shift'], 'KeyN')],
  [ActionIDs.layerGroup, new KeyInput(['MetaOrControl'], 'KeyG')],
  [ActionIDs.layerRemove, new KeyInput(['MetaOrControl'], 'Delete')],
  [ActionIDs.layerMerge, new KeyInput(['MetaOrControl'], 'KeyE')],
  [ActionIDs.layerClear, new KeyInput([], 'Delete')],
  [ActionIDs.layerFill, new KeyInput(['Alt'], 'Delete')],

  [ActionIDs.viewReload, new KeyInput(['MetaOrControl'], 'KeyR')],
  [ActionIDs.viewToggleDevTools, process.platform === 'darwin' ? new KeyInput(['Alt', 'Meta'], 'KeyI') : new KeyInput(['Control', 'Shift'], 'KeyI')],
  [ActionIDs.viewActualSize, new KeyInput(['MetaOrControl'], 'Digit0')],
  [ActionIDs.viewZoomIn, new KeyInput(['MetaOrControl'], 'Equal')],
  [ActionIDs.viewZoomOut, new KeyInput(['MetaOrControl'], 'Minus')],
  [ActionIDs.viewToggleUIPanels, new KeyInput([], 'Tab')],
  [ActionIDs.viewToggleFullscreen, process.platform === 'darwin' ? new KeyInput(['Meta'], 'KeyF') : new KeyInput([], 'F11')],
)
