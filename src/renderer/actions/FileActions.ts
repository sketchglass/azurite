import Action, {PictureAction} from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction} from "../state/ActionRegistry"
import {appState} from "../state/AppState"

@addAction
export class FileNewAction extends Action {
  id = ActionIDs.fileNew
  title = "New..."
  enabled = true
  run() {
    appState.newPicture()
  }
}

@addAction
export class FileOpenAction extends Action {
  id = ActionIDs.fileOpen
  title = "Open..."
  enabled = true
  run() {
    appState.openPicture()
  }
}

@addAction
export class FileSaveAction extends PictureAction {
  id = ActionIDs.fileSave
  title = "Save"
  run() {
    this.pictureState && this.pictureState.save()
  }
}

@addAction
export class FileSaveAsAction extends PictureAction {
  id = ActionIDs.fileSaveAs
  title = "Save As..."
  run() {
    this.pictureState && this.pictureState.saveAs()
  }
}

@addAction
export class FileImportAction extends PictureAction {
  id = ActionIDs.fileImport
  title = "Import..."
  run() {
    this.pictureState && this.pictureState.import()
  }
}

// TODO: implement export action

@addAction
export class FileCloseAction extends PictureAction {
  id = ActionIDs.fileClose
  title = "Close"
  run() {
    appState.closePicture(appState.currentPictureIndex)
  }
}
