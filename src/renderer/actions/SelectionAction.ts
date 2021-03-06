import {remote} from 'electron'
import {addAction} from '../app/ActionRegistry'
import {SelectAllCommand, ClearSelectionCommand, InvertSelectionCommand} from '../commands/SelectionCommand'
import {currentFocus} from '../views/CurrentFocus'
import {PictureAction} from './Action'
import ActionIDs from './ActionIDs'

@addAction
export class SelectionSelectAllAction extends PictureAction {
  id = ActionIDs.selectionSelectAll
  title = 'Select All'
  get enabled() {
    return currentFocus.isTextInput || !!this.pictureState
  }
  run() {
    if (currentFocus.isTextInput) {
      remote.getCurrentWebContents().selectAll()
    } else if (this.picture) {
      this.picture.undoStack.push(new SelectAllCommand(this.picture))
    }
  }
}

@addAction
export class SelectionClearAction extends PictureAction {
  id = ActionIDs.selectionClear
  title = 'Clear Selection'
  run() {
    this.picture && this.picture.undoStack.push(new ClearSelectionCommand(this.picture))
  }
}

@addAction
export class SelectionInvertAction extends PictureAction {
  id = ActionIDs.selectionInvert
  title = 'Invert Selection'
  run() {
    this.picture && this.picture.undoStack.push(new InvertSelectionCommand(this.picture))
  }
}
