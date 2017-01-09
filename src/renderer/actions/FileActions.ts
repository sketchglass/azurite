import Action, {PictureAction} from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction, actionRegistry} from "../state/ActionRegistry"
import ImageFormat from "../formats/ImageFormat"
import {formatRegistry} from "../state/FormatRegistry"
import {appState} from "../state/AppState"
import {PictureExport} from "../services/PictureExport"

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
  async run() {
    if (this.picture) {
      const pictureExport = new PictureExport(this.picture)
      await pictureExport.showImportDialog()
      pictureExport.dispose()
    }
  }
}

export class FileExportAction extends PictureAction {
  id = `${ActionIDs.fileExport}:${this.format.mimeType}`
  title = `Export ${this.format.title}...`
  constructor(public format: ImageFormat) {
    super()
  }

  async run() {
    if (this.picture) {
      const pictureExport = new PictureExport(this.picture)
      await pictureExport.showExportDialog(this.format)
      pictureExport.dispose()
    }
  }
}

for (const format of formatRegistry.imageFormats) {
  actionRegistry.add(new FileExportAction(format))
}

@addAction
export class FileCloseAction extends PictureAction {
  id = ActionIDs.fileClose
  title = "Close"
  run() {
    appState.closePicture(appState.currentPictureIndex)
  }
}
