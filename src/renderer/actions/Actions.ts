import {remote} from "electron"
import Action from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction} from "./ActionManager"
import {appState} from "../state/AppState"
import {editActionState} from "../state/EditActionState"

abstract class PictureAction extends Action {
  get picture() {
    return appState.currentPicture
  }
  get pictureState() {
    return appState.currentPictureState
  }
  get enabled() {
    return !!this.picture
  }
}

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

@addAction
export class CanvasChangeResolutionAction extends PictureAction {
  id = ActionIDs.canvasChangeResolution
  title = "Change Canvas Resolution..."
  run() {
    this.pictureState && this.pictureState.changeResolution()
  }
}

@addAction
export class CanvasRotateLeftAction extends PictureAction {
  id = ActionIDs.canvasRotateLeft
  title = "Rotate 90° Left"
  run() {
    this.pictureState && this.pictureState.rotate90("left")
  }
}

@addAction
export class CanvasRotateRightAction extends PictureAction {
  id = ActionIDs.canvasRotateRight
  title = "Rotate 90° Right"
  run() {
    this.pictureState && this.pictureState.rotate90("right")
  }
}

@addAction
export class CanvasRotate180Action extends PictureAction {
  id = ActionIDs.canvasRotate180
  title = "Rotate 180°"
  run() {
    this.pictureState && this.pictureState.rotate180()
  }
}

@addAction
export class CanvasFlipHorizontallyAction extends PictureAction {
  id = ActionIDs.canvasFlipHorizontally
  title = "Flip Horizontally"
  run() {
    this.pictureState && this.pictureState.flip("horizontal")
  }
}

@addAction
export class CanvasFlipVerticallyAction extends PictureAction {
  id = ActionIDs.canvasFlipVertically
  title = "Flip Vertically"
  run() {
    this.pictureState && this.pictureState.flip("vertical")
  }
}

@addAction
export class ViewReloadAction extends Action {
  id = ActionIDs.viewReload
  title = "Reload"
  enabled = true
  run() {
    appState.reload()
  }
}

@addAction
export class ViewToggleDevToolsAction extends Action {
  id = ActionIDs.viewToggleDevTools
  title = "Toggle Developer Tools"
  enabled = true
  run() {
    remote.getCurrentWebContents().toggleDevTools()
  }
}

@addAction
export class ViewActualSizeAction extends PictureAction {
  id = ActionIDs.viewActualSize
  title = "Actual Size"
  run() {
    this.picture && this.picture.navigation.resetScale()
  }
}

@addAction
export class ViewZoomInAction extends PictureAction {
  id = ActionIDs.viewZoomIn
  title = "Zoom In"
  run() {
    this.picture && this.picture.navigation.zoomIn()
  }
}

@addAction
export class ViewZoomOutAction extends PictureAction {
  id = ActionIDs.viewZoomOut
  title = "Zoom Out"
  run() {
    this.picture && this.picture.navigation.zoomOut()
  }
}

@addAction
export class ViewToggleUIPanelsAction extends Action {
  id = ActionIDs.viewToggleUIPanels
  get title() { return appState.uiVisible ? "Hide UI Panels" : "Show UI Panels" }
  enabled = true
  run() {
    appState.toggleUIVisible()
  }
}

@addAction
export class ViewToggleFullscreenAction extends Action {
  id = ActionIDs.viewToggleFullscreen
  title = "Toggle Fullscreen"
  enabled = true
  run() {
    appState.toggleUIVisible()
  }
}
