import {addAction, actionRegistry} from '../app/ActionRegistry'
import {appState} from '../app/AppState'
import {formatRegistry} from '../app/FormatRegistry'
import PictureFormat from '../formats/PictureFormat'
import {PictureExport} from '../services/PictureExport'
import Action, {PictureAction} from './Action'
import ActionIDs from './ActionIDs'

@addAction
export class FileNewAction extends Action {
  id = ActionIDs.fileNew
  title = 'New...'
  enabled = true
  run() {
    appState.newPicture()
  }
}

@addAction
export class FileOpenAction extends Action {
  id = ActionIDs.fileOpen
  title = 'Open...'
  enabled = true
  run() {
    appState.openPicture()
  }
}

@addAction
export class FileSaveAction extends PictureAction {
  id = ActionIDs.fileSave
  title = 'Save'
  run() {
    this.pictureState && this.pictureState.save()
  }
}

@addAction
export class FileSaveAsAction extends PictureAction {
  id = ActionIDs.fileSaveAs
  title = 'Save As...'
  run() {
    this.pictureState && this.pictureState.saveAs()
  }
}

export class FileExportAction extends PictureAction {
  id = `${ActionIDs.fileExport}:${this.format.mimeType}`
  title = `Export ${this.format.title}...`
  constructor(public format: PictureFormat) {
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

for (const format of formatRegistry.pictureFormats) {
  actionRegistry.add(new FileExportAction(format))
}

@addAction
export class FileCloseAction extends PictureAction {
  id = ActionIDs.fileClose
  title = 'Close'
  run() {
    appState.closePicture(appState.currentPictureIndex)
  }
}
