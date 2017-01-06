import Action, {PictureAction} from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction, actionRegistry} from "../state/ActionRegistry"
import ImageFormat from "../formats/ImageFormat"
import {formatRegistry} from "../state/FormatRegistry"
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

export class FileExportAction extends PictureAction {
  id = `${ActionIDs.fileExport}:${this.format.mimeType}`
  title = `Export ${this.format.title}...`
  constructor(public format: ImageFormat) {
    super()
  }

  run() {
    this.pictureState && this.pictureState.export(this.format)
  }
}

for (const format of formatRegistry.imageFormats) {
  actionRegistry.add(new FileExportAction(format))
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
