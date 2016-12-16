import {action} from "mobx"
import * as React from "react"
import {observer} from "mobx-react"
import {remote} from "electron"
import * as classNames from "classnames"

import SVGIcon from "./components/SVGIcon"

import {appState} from "../state/AppState"

import Tool from "../tools/Tool"
import BaseBrushTool from "../tools/BaseBrushTool"
import BrushTool from "../tools/BrushTool"
import WatercolorTool from "../tools/WatercolorTool"

const {Menu} = remote

const toolToIcon = (tool: Tool) => {
  const map = {
    "Watercolor": "paint-brush",
    "Brush": "pen",
    "Pan": "move",
    "Rotate": "rotate",
    "Move": "transform",
    "Zoom": "search",
    "Rectangle Select": "rect-select",
    "Ellipse Select": "ellipse-select",
    "Freehand Select": "freehand-select",
    "Polygon Select": "polygon-select",
    "Canvas Area": "crop",
  }
  return <SVGIcon className={map[tool.name]} />
}

@observer
export default
class ToolSelection extends React.Component<{}, {}> {
  render() {
    const {tools, currentTool} = appState
    const nonBrushTools = tools.filter(tool => !(tool instanceof BaseBrushTool))
    const brushTools = tools.filter(tool => tool instanceof BaseBrushTool)
    return (
      <div className="ToolSelection">{
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
    appState.currentTool = tool
  })
  private onContextMenu = action((selectedTool: Tool, e: React.MouseEvent<Element>) => {
    e.preventDefault()
    const removeTool = action(() => {
      const index = appState.tools.indexOf(selectedTool)
      appState.tools.splice(index, 1)
    })
    const appendTool = action((item: Tool) => {
      return () => {
        const index = appState.tools.indexOf(selectedTool) + 1
        appState.tools.splice(index, 0, item)
      }
    })
    const menuTemplate = [
      {label: '追加', submenu: [
        {label: "BrushTool", click: appendTool(new BrushTool())},
        {label: "WatercolorTool", click: appendTool(new WatercolorTool())}
      ]},
      {label: '削除', click: removeTool}
    ]
    const menu = Menu.buildFromTemplate(menuTemplate)
    menu.popup(remote.getCurrentWindow())
  })
}
