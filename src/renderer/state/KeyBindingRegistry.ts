import KeyInput from "../../lib/KeyInput"
import ActionIDs from "../actions/ActionIDs"

interface KeyBinding {
  action: string
  keyInput: KeyInput
}

export default
class KeyBindingRegistry {
  keyBindings = new Map<string, KeyBinding>()
  keyToKeyBindings = new Map<string, KeyBinding[]>()

  keyInputForAction(id: string) {
    const keyBinding = this.keyBindings.get(id)
    if (keyBinding) {
      return keyBinding.keyInput
    }
  }

  keyBindingsForKey(key: string) {
    return this.keyToKeyBindings.get(key) || []
  }

  add(...keyBindings: [string, KeyInput][]) {
    for (const [action, keyInput] of keyBindings) {
      const keyBinding = {action, keyInput}
      this.keyBindings.set(action, keyBinding)
      if (this.keyToKeyBindings.has(keyInput.key)) {
        this.keyToKeyBindings.get(keyInput.key)!.push(keyBinding)
      } else {
        this.keyToKeyBindings.set(keyInput.key, [keyBinding])
      }
    }
  }
}

export const keyBindingRegistry = new KeyBindingRegistry()

keyBindingRegistry.add(
  [ActionIDs.fileNew, new KeyInput(["CommandOrControl"], "n")],
  [ActionIDs.fileOpen, new KeyInput(["CommandOrControl"], "o")],
  [ActionIDs.fileSave, new KeyInput(["CommandOrControl"], "s")],
  [ActionIDs.fileSaveAs, new KeyInput(["CommandOrControl", "Shift"], "s")],
  [ActionIDs.fileClose, new KeyInput(["CommandOrControl"], "w")],

  [ActionIDs.editUndo, new KeyInput(["CommandOrControl"], "z")],
  [ActionIDs.editRedo, process.platform == "darwin" ? new KeyInput(["Shift", "Command"], "z") : new KeyInput(["Control"], "y")],
  [ActionIDs.editCut, new KeyInput(["CommandOrControl"], "x")],
  [ActionIDs.editCopy, new KeyInput(["CommandOrControl"], "c")],
  [ActionIDs.editPaste, new KeyInput(["CommandOrControl"], "v")],

  [ActionIDs.selectionSelectAll, new KeyInput(["CommandOrControl"], "a")],
  [ActionIDs.selectionClear, new KeyInput(["CommandOrControl"], "d")],
  [ActionIDs.selectionInvert, new KeyInput(["Shift", "CommandOrControl"], "i")],

  [ActionIDs.layerAdd, new KeyInput(["CommandOrControl", "Shift"], "n")],
  [ActionIDs.layerGroup, new KeyInput(["CommandOrControl"], "g")],
  [ActionIDs.layerRemove, new KeyInput(["CommandOrControl"], "Delete")],
  [ActionIDs.layerMerge, new KeyInput(["CommandOrControl"], "e")],
  [ActionIDs.layerClear, new KeyInput([], "Delete")],

  [ActionIDs.viewReload, new KeyInput(["CommandOrControl"], "r")],
  [ActionIDs.viewToggleDevTools, process.platform == "darwin" ? new KeyInput(["Alt", "Command"], "i") : new KeyInput(["Control", "Shift"], "i")],
  [ActionIDs.viewActualSize, new KeyInput(["CommandOrControl"], "0")],
  [ActionIDs.viewZoomIn, new KeyInput(["CommandOrControl"], "+")],
  [ActionIDs.viewZoomOut, new KeyInput(["CommandOrControl"], "-")],
  [ActionIDs.viewToggleUIPanels, new KeyInput([], "Tab")],
  [ActionIDs.viewToggleFullscreen, process.platform == "darwn" ? new KeyInput(["Command"], "f") : new KeyInput([], "F11")],
)
