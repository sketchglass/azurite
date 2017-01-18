import {action} from "mobx"
import * as React from "react"
import {observer} from "mobx-react"
import {remote} from "electron"
import * as classNames from "classnames"

import SVGIcon from "./components/SVGIcon"

import {toolManager} from "../app/ToolManager"

import Tool from "../tools/Tool"
import ToolIDs from "../tools/ToolIDs"
import BrushTool from "../tools/BrushTool"
import PenTool from "../tools/PenTool"
import WatercolorTool from "../tools/WatercolorTool"

const {Menu} = remote

const toolToIcon = (tool: Tool) => {
  const map = {
    [ToolIDs.watercolor]: "paint-brush",
    [ToolIDs.pen]: "pen",
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
    const brushTools = tools.filter(tool => tool instanceof BrushTool)
    return (
      <div className="ToolSelection" hidden={hidden}>{
          nonBrushTools.map((tool, i) => {
            const selected = tool === currentTool
            const className = classNames("ToolSelection_button", {"ToolSelection_button-selected": selected})
            const onClick = () => this.onChange(tool)
            return <button key={i} onClick={onClick} className={className}>{toolToIcon(tool)}</button>
          })
        }{
          brushTools.map((tool, i) => {
            const onContextMenu = (e: React.MouseEvent<Element>) => this.onContextMenu(tool, e)
            const selected = tool === currentTool
            const className = classNames("ToolSelection_button", {"ToolSelection_button-selected": selected})
            const onClick = () => this.onChange(tool)
            return <button key={i} onContextMenu={onContextMenu} onClick={onClick} className={className}>{toolToIcon(tool)}</button>
          })
        }
      </div>
    )
  }
  private onChange = action((tool: Tool) => {
    toolManager.currentTool = tool
  })
  private onContextMenu = action((selectedTool: Tool, e: React.MouseEvent<Element>) => {
    e.preventDefault()
    const removeTool = action(() => {
      const index = toolManager.tools.indexOf(selectedTool)
      toolManager.tools.splice(index, 1)
    })
    const appendTool = action((item: Tool) => {
      return () => {
        const index = toolManager.tools.indexOf(selectedTool) + 1
        toolManager.tools.splice(index, 0, item)
      }
    })
    const menuTemplate = [
      {label: 'Add', submenu: [
        {label: "Pen", click: appendTool(new PenTool())},
        {label: "Watercolor", click: appendTool(new WatercolorTool())}
      ]},
      {label: 'Remove', click: removeTool}
    ]
    const menu = Menu.buildFromTemplate(menuTemplate)
    menu.popup(remote.getCurrentWindow())
  })
}
