import {observer} from "mobx-react"
import {toolManager} from "../../app/ToolManager"

export default observer(() => {
  const {currentTool} = toolManager
  return currentTool.renderSettings()
})
