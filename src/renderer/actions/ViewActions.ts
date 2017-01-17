import {remote} from "electron"
import Action, {PictureAction} from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction} from "../app/ActionRegistry"
import {appState} from "../app/AppState"

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
