import KeyInput from "../../lib/KeyInput"
import ActionIDs from "../actions/ActionIDs"

export default
class KeyBindingRegistry {
  keyBindings = new Map<string, KeyInput>()

  add(...keyBindings: [string, KeyInput][]) {
    for (const [id, keyInput] of keyBindings) {
      this.keyBindings.set(id, keyInput)
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

  [ActionIDs.viewReload, new KeyInput(["CommandOrControl"], "r")],
  [ActionIDs.viewToggleDevTools, process.platform == "darwin" ? new KeyInput(["Alt", "Command"], "i") : new KeyInput(["Control", "Shift"], "i")],
  [ActionIDs.viewActualSize, new KeyInput(["CommandOrControl"], "0")],
  [ActionIDs.viewZoomIn, new KeyInput(["CommandOrControl"], "+")],
  [ActionIDs.viewZoomOut, new KeyInput(["CommandOrControl"], "-")],
  [ActionIDs.viewToggleUIPanels, new KeyInput([], "Tab")],
  [ActionIDs.viewToggleFullscreen, process.platform == "darwn" ? new KeyInput(["Command"], "f") : new KeyInput([], "F11")],
)
