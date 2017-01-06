import {remote} from "electron"
import {PictureAction} from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction} from "../state/ActionRegistry"
import {currentFocus} from "../views/CurrentFocus"

@addAction
export class SelectionSelectAllAction extends PictureAction {
  id = ActionIDs.selectionSelectAll
  title = "Select All"
  get enabled() {
    return currentFocus.isTextInput || !!this.pictureState
  }
  run() {
    if (currentFocus.isTextInput) {
      remote.getCurrentWebContents().selectAll()
    } else if (this.pictureState) {
      this.pictureState.selectAll()
    }
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
