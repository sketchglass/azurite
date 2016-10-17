import React = require("react")
import {action} from "mobx"
import {observer} from "mobx-react"
import Tool from "../models/Tool"
import BaseBrushTool from "../models/BaseBrushTool"
import BrushTool from "../models/BrushTool"
import WatercolorTool from "../models/WatercolorTool"
import BrushSettings from "./BrushSettings"
import WatercolorSettings from "./WatercolorSettings"
import DrawArea from "./DrawArea"
import LayerList from "./LayerList"
import ColorPicker from "./ColorPicker"
import Palette from "./Palette"
import Navigator from "./Navigator"
import RGBRangeSliders from "./components/RGBRangeSliders"
import {DraggablePanel, DraggablePanelContainer} from "./components/DraggablePanel"
import {HSVColor} from "../../lib/Color"
import NavigationKeyBinding from "./NavigationKeyBinding"
import {AppState} from "../models/AppState"
import {remote} from "electron"
const {Menu, app} = remote
import "./MenuBar"
import "../../styles/App.sass"

function ToolSelection(props: {tools: Tool[], currentTool: Tool, onChange: (tool: Tool) => void, onContextMenu: (tool: Tool, e: React.MouseEvent<Element>) => void}) {
  return (
    <div className="ToolSelection">
      <div className="ToolSelection_subtools">{
        props.tools.filter(tool => { return !(tool instanceof BaseBrushTool) }).map((tool, i) => {
          const selected = tool === props.currentTool
          const className = (selected) ? "ToolSelection_button ToolSelection_button-selected" : "ToolSelection_button"
          const onClick = () => props.onChange(tool)
          return <button key={i} onClick={onClick} className={className}>{tool.name}</button>
        })
      }</div>
      <div className="ToolSelection_brushes">{
        props.tools.filter(tool => { return tool instanceof BaseBrushTool }).map((tool, i) => {
          const onContextMenu = (e: React.MouseEvent<Element>) => props.onContextMenu(tool, e)
          const selected = tool === props.currentTool
          const className = (selected) ? "ToolSelection_button ToolSelection_button-selected" : "ToolSelection_button"
          const onClick = () => props.onChange(tool)
          return <button key={i} onContextMenu={onContextMenu} onClick={onClick} className={className}>{tool.name}</button>
        })
      }</div>
    </div>
  )
}

@observer export default
class App extends React.Component<{}, {}> {
  constructor() {
    super()
    const appState = AppState.instance

    new NavigationKeyBinding(klass => {
      if (klass) {
        for (const tool of appState.tools) {
          if (tool instanceof klass) {
            appState.overrideTool = tool
          }
        }
      } else {
        appState.overrideTool = undefined
      }
    })
  }
  render() {
    const appState = AppState.instance
    const {tools, currentTool, overrideTool, color, paletteIndex, palette} = appState
    const picture = appState.currentPicture! // TODO: support undefined current picture
    const onToolChange = (tool: Tool) => {
      appState.currentTool = tool
    }
    const onToolContextMenu = action((selectedTool: Tool, e: React.MouseEvent<Element>) => {
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
    const onPaletteChange = action((e: React.MouseEvent<Element>, index: number) => {
      appState.paletteIndex = index
      if(e.shiftKey) {
        appState.palette[index] = appState.color
      } else {
        appState.color = appState.palette[index]
      }
    })
    const onColorChange = action((value: HSVColor) => {
      appState.color = value
    })
    return (
      <div className="App">
        <aside className="LeftSidebar">
          <DraggablePanelContainer top={20} left={18} margin={14} labelHeight={20}>
            <DraggablePanel label="Color" width={200} height={200}>
              <ColorPicker color={color} onChange={onColorChange} />
            </DraggablePanel>
            <DraggablePanel label="Slider" width={200} height={70}>
              <RGBRangeSliders color={color} onChange={onColorChange} />
            </DraggablePanel>
            <DraggablePanel label="Palette" width={200} height={80}>
              <Palette palette={palette} paletteIndex={paletteIndex} onChange={onPaletteChange} />
            </DraggablePanel>
            <DraggablePanel label="Tools" width={200} height={80}>
              <ToolSelection tools={tools} currentTool={currentTool} onChange={onToolChange} onContextMenu={onToolContextMenu} />
            </DraggablePanel>
            <DraggablePanel label="Settings" width={200} height={200}>
              {currentTool.renderSettings()}
            </DraggablePanel>
          </DraggablePanelContainer>
        </aside>
        <DrawArea tool={overrideTool ? overrideTool : currentTool} picture={picture} />
        <aside className="RightSidebar">
          <Navigator picture={picture} />
          <LayerList picture={picture} />
        </aside>
      </div>
    )
  }
}
