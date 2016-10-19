import React = require("react")
import {action} from "mobx"
import {observer} from "mobx-react"
import Tool from "../tools/Tool"
import BaseBrushTool from "../tools/BaseBrushTool"
import BrushTool from "../tools/BrushTool"
import WatercolorTool from "../tools/WatercolorTool"
import DrawArea from "./DrawArea"
import LayerList from "./LayerList"
import ColorPicker from "./components/ColorPicker"
import Palette from "./Palette"
import Navigator from "./Navigator"
import RGBRangeSliders from "./components/RGBRangeSliders"
import {DraggablePanel, DraggablePanelContainer} from "./components/DraggablePanel"
import {PictureTabBar} from "./PictureTabBar"
import {HSVColor} from "../../lib/Color"
import NavigationKeyBinding from "./NavigationKeyBinding"
import {AppViewModel} from "../viewmodels/AppViewModel"
import {remote} from "electron"
const {Menu, app} = remote
import "./MenuBar"
import "../../styles/main.css"

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
    const appVM = AppViewModel.instance

    new NavigationKeyBinding(klass => {
      if (klass) {
        for (const tool of appVM.tools) {
          if (tool instanceof klass) {
            appVM.overrideTool = tool
          }
        }
      } else {
        appVM.overrideTool = undefined
      }
    })
  }
  render() {
    const appVM = AppViewModel.instance
    const {tools, currentTool, overrideTool, color, paletteIndex, palette} = appVM
    const picture = appVM.currentPicture
    const onToolChange = (tool: Tool) => {
      appVM.currentTool = tool
    }
    const onToolContextMenu = action((selectedTool: Tool, e: React.MouseEvent<Element>) => {
      e.preventDefault()
      const removeTool = action(() => {
        const index = appVM.tools.indexOf(selectedTool)
        appVM.tools.splice(index, 1)
      })
      const appendTool = action((item: Tool) => {
        return () => {
          const index = appVM.tools.indexOf(selectedTool) + 1
          appVM.tools.splice(index, 0, item)
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
      appVM.paletteIndex = index
      if(e.shiftKey) {
        appVM.palette[index] = appVM.color
      } else {
        appVM.color = appVM.palette[index]
      }
    })
    const onColorChange = action((value: HSVColor) => {
      appVM.color = value
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
        <div className="CenterArea">
          <PictureTabBar />
          <DrawArea tool={overrideTool ? overrideTool : currentTool} picture={picture} />
        </div>
        <aside className="RightSidebar">
          <Navigator picture={picture} />
          <LayerList picture={picture} />
        </aside>
      </div>
    )
  }
}
