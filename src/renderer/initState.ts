import {webFrame} from "electron"
import {appState} from "./app/AppState"

webFrame.setVisualZoomLevelLimits(1, 1)
webFrame.setLayoutZoomLevelLimits(1, 1)

appState.bootstrap()
