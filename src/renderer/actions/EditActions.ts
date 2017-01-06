import Action from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction} from "../state/ActionRegistry"
import {editActionState} from "../state/EditActionState"

@addAction
export class EditUndoAction extends Action {
  id = ActionIDs.editUndo
  get title() { return `Undo ${editActionState.undoName}` }
  get enabled() { return editActionState.canUndo }
  run() {
    editActionState.undo()
  }
}

@addAction
export class EditRedoAction extends Action {
  id = ActionIDs.editRedo
  get title() { return `Redo ${editActionState.redoName}` }
  get enabled() { return editActionState.canRedo }
  run() {
    editActionState.redo()
  }
}

@addAction
export class EditCutAction extends Action {
  id = ActionIDs.editCut
  title = "Cut"
  enabled = true
  run() {
    editActionState.cut()
  }
}

@addAction
export class EditCopyAction extends Action {
  id = ActionIDs.editCopy
  title = "Copy"
  enabled = true
  run() {
    editActionState.copy()
  }
}

@addAction
export class EditPasteAction extends Action {
  id = ActionIDs.editPaste
  title = "Paste"
  enabled = true
  run() {
    editActionState.paste()
  }
}

@addAction
export class EditDeleteAction extends Action {
  id = ActionIDs.editDelete
  title = "Delete"
  enabled = true
  run() {
    editActionState.delete()
  }
}
