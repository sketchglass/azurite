import * as React from "react"
import {}

class ToolSelection extends React.Component<{}, {}> {
  render() {
    return (
      <div className="AppItem">
        <ToolSelection tools={tools} currentTool={currentTool} onChange={onToolChange} onContextMenu={onToolContextMenu} />
      </div>
    )
  }
}
