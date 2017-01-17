import {observer} from "mobx-react"
import {appState} from "../../app/AppState"

export default observer(() => {
  const {currentTool} = appState
  return currentTool.renderSettings()
})
