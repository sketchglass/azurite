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
  [ActionIDs.fileNew, new KeyInput(["MetaOrControl"], "n")],
  [ActionIDs.fileOpen, new KeyInput(["MetaOrControl"], "o")],
  [ActionIDs.fileSave, new KeyInput(["MetaOrControl"], "s")],
  [ActionIDs.fileSaveAs, new KeyInput(["MetaOrControl", "Shift"], "s")],
  [ActionIDs.fileClose, new KeyInput(["MetaOrControl"], "w")],

  [ActionIDs.editUndo, new KeyInput(["MetaOrControl"], "z")],
  [ActionIDs.editRedo, process.platform == "darwin" ? new KeyInput(["Shift", "Meta"], "z") : new KeyInput(["Control"], "y")],
  [ActionIDs.editCut, new KeyInput(["MetaOrControl"], "x")],
  [ActionIDs.editCopy, new KeyInput(["MetaOrControl"], "c")],
  [ActionIDs.editPaste, new KeyInput(["MetaOrControl"], "v")],

  [ActionIDs.selectionSelectAll, new KeyInput(["MetaOrControl"], "a")],
  [ActionIDs.selectionClear, new KeyInput(["MetaOrControl"], "d")],
  [ActionIDs.selectionInvert, new KeyInput(["Shift", "MetaOrControl"], "i")],

  [ActionIDs.layerAdd, new KeyInput(["MetaOrControl", "Shift"], "n")],
  [ActionIDs.layerGroup, new KeyInput(["MetaOrControl"], "g")],
  [ActionIDs.layerRemove, new KeyInput(["MetaOrControl"], "Delete")],
  [ActionIDs.layerMerge, new KeyInput(["MetaOrControl"], "e")],
  [ActionIDs.layerClear, new KeyInput([], "Delete")],
  [ActionIDs.layerFill, new KeyInput(["Alt"], "Delete")],

  [ActionIDs.viewReload, new KeyInput(["MetaOrControl"], "r")],
  [ActionIDs.viewToggleDevTools, process.platform == "darwin" ? new KeyInput(["Alt", "Meta"], "i") : new KeyInput(["Control", "Shift"], "i")],
  [ActionIDs.viewActualSize, new KeyInput(["MetaOrControl"], "0")],
  [ActionIDs.viewZoomIn, new KeyInput(["MetaOrControl"], "+")],
  [ActionIDs.viewZoomOut, new KeyInput(["MetaOrControl"], "-")],
  [ActionIDs.viewToggleUIPanels, new KeyInput([], "Tab")],
  [ActionIDs.viewToggleFullscreen, process.platform == "darwin" ? new KeyInput(["Meta"], "f") : new KeyInput([], "F11")],
)
