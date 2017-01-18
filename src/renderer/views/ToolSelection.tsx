import {action} from "mobx"
import * as React from "react"
import {observer} from "mobx-react"
import * as classNames from "classnames"

import SVGIcon from "./components/SVGIcon"

import {toolManager} from "../app/ToolManager"

import Tool from "../tools/Tool"
import ToolIDs from "../tools/ToolIDs"
import BrushTool from "../tools/BrushTool"

const toolToIcon = (tool: Tool) => {
  const map = {
    [ToolIDs.pan]: "move",
    [ToolIDs.rotate]: "rotate",
    [ToolIDs.zoom]: "search",
    [ToolIDs.transformLayer]: "transform",
    [ToolIDs.rectSelect]: "rect-select",
    [ToolIDs.ellipseSelect]: "ellipse-select",
    [ToolIDs.freehandSelect]: "freehand-select",
    [ToolIDs.polygonSelect]: "polygon-select",
    [ToolIDs.floodFill]: "magic-wand",
    [ToolIDs.canvasArea]: "crop",
  }
  return <SVGIcon className={map[tool.id]} />
}

@observer
export default
class ToolSelection extends React.Component<{hidden: boolean}, {}> {
  render() {
    const {hidden} = this.props
    const {tools, currentTool} = toolManager
    const nonBrushTools = tools.filter(tool => !(tool instanceof BrushTool))
    return (
      <div className="ToolSelection" hidden={hidden}>{
          nonBrushTools.map((tool, i) => {
            const selected = tool === currentTool
            const className = classNames("ToolSelection_button", {"ToolSelection_button-selected": selected})
            const onClick = () => this.onChange(tool)
            return <button key={i} onClick={onClick} className={className}>{toolToIcon(tool)}</button>
          })
        }
      </div>
    )
  }
  private onChange = action((tool: Tool) => {
    toolManager.currentTool = tool
  })
}
