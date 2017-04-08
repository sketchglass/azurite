import {remote} from 'electron'
import Action from './Action'
import ActionIDs from './ActionIDs'
import {addAction} from '../app/ActionRegistry'
import {currentFocus} from '../views/CurrentFocus'
import {appState} from '../app/AppState'

@addAction
export class EditUndoAction extends Action {
  id = ActionIDs.editUndo
  get title() {
    if (!currentFocus.isTextInput && appState.undoStack) {
      const {undoCommand} = appState.undoStack
      if (undoCommand) {
        return `Undo ${undoCommand.title}`
      }
    }
    return 'Undo'
  }
  get enabled() {
    if (currentFocus.isTextInput) {
      return true
    } else if (appState.undoStack) {
      return appState.undoStack.isUndoable
    }
    return false
  }
  run() {
    if (currentFocus.isTextInput) {
      remote.getCurrentWebContents().undo()
    } else if (appState.undoStack) {
      appState.undoStack.undo()
    }
  }
}

@addAction
export class EditRedoAction extends Action {
  id = ActionIDs.editRedo
  get title() {
    if (!currentFocus.isTextInput && appState.undoStack) {
      const {redoCommand} = appState.undoStack
      if (redoCommand) {
        return `Redo ${redoCommand.title}`
      }
    }
    return 'Redo'
  }
  get enabled() {
    if (currentFocus.isTextInput) {
      return true
    } else if (appState.undoStack) {
      return appState.undoStack.isRedoable
    }
    return false
  }
  run() {
    if (currentFocus.isTextInput) {
      remote.getCurrentWebContents().redo()
    } else if (appState.undoStack) {
      appState.undoStack.redo()
    }
  }
}

@addAction
export class EditCutAction extends Action {
  id = ActionIDs.editCut
  title = 'Cut'
  enabled = true
  run() {
    remote.getCurrentWebContents().cut()
  }
}

@addAction
export class EditCopyAction extends Action {
  id = ActionIDs.editCopy
  title = 'Copy'
  enabled = true
  run() {
    remote.getCurrentWebContents().copy()
  }
}

@addAction
export class EditPasteAction extends Action {
  id = ActionIDs.editPaste
  title = 'Paste'
  enabled = true
  run() {
    remote.getCurrentWebContents().paste()
  }
}

@addAction
export class EditDeleteAction extends Action {
  id = ActionIDs.editDelete
  title = 'Delete'
  enabled = true
  run() {
    remote.getCurrentWebContents().delete()
  }
}
