import Action, {PictureAction} from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction} from "../state/ActionRegistry"
import {editActionState} from "../state/EditActionState"

@addAction
export class SelectionSelectAllAction extends Action {
  id = ActionIDs.selectionSelectAll
  title = "Select All"
  get enabled() {
    return editActionState.canSelectAll
  }
  run() {
    editActionState.selectAll()
  }
}

@addAction
export class SelectionClearAction extends PictureAction {
  id = ActionIDs.selectionClear
  title = "Clear Selection"
  run() {
    this.pictureState && this.pictureState.clearSelection()
  }
}

@addAction
export class SelectionInvertAction extends PictureAction {
  id = ActionIDs.selectionInvert
  title = "Invert Selection"
  run() {
    this.pictureState && this.pictureState.invertSelection()
  }
}
