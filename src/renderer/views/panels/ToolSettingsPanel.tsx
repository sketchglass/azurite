import {observer} from "mobx-react"
import {appState} from "../../state/AppState"

export default observer(() => {
  const {currentTool} = appState
  return currentTool.renderSettings()
})
