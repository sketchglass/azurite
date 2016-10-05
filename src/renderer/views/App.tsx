import React = require("react")
import Picture from "../models/Picture"
import Tool from "../models/Tool"
import BaseBrushTool from "../models/BaseBrushTool"
import BrushTool from "../models/BrushTool"
import WatercolorTool from "../models/WatercolorTool"
import PanTool from "../models/PanTool"
import {ZoomInTool, ZoomOutTool} from "../models/ZoomTool"
import RotateTool from "../models/RotateTool"
import BrushSettings from "./BrushSettings"
import WatercolorSettings from "./WatercolorSettings"
import DrawArea from "./DrawArea"
import LayerList from "./LayerList"
import ColorPicker from "./ColorPicker"
import Palette from "./Palette"
import Navigator from "./Navigator"
import {Color} from "../../lib/Color"
import {Vec2, Vec4} from "../../lib/Geometry"
import NavigationKeyBinding from "./NavigationKeyBinding"
import {remote} from "electron"
const {Menu, app} = remote
import "./MenuBar"
import "../../styles/App.sass"

function ToolSelection(props: {tools: Tool[], currentTool: Tool, onChange: (tool: Tool) => void, onContextMenu: (tool: Tool, e: React.MouseEvent<Element>) => void}) {
  return (
    <div className="ToolSelection">{
      props.tools.map((tool, i) => {
        const onChange = () => props.onChange(tool)
        const onContextMenu = (e: React.MouseEvent<Element>) => props.onContextMenu(tool, e)
        return <label key={i} onContextMenu={onContextMenu}><input type="radio" checked={tool == props.currentTool} onChange={onChange}/>{tool.name}</label>
      })
    }</div>
  )
}

export default
class App extends React.Component<void, void> {
  picture = new Picture()
  tools: Tool[] = [new BrushTool(), new WatercolorTool(), new PanTool(), new ZoomInTool(), new ZoomOutTool(), new RotateTool()]
  currentTool = this.tools[0]
  overrideTool: Tool|undefined
  brushColor: Color
  paletteIndex: number = 0
  palette: Color[] = [
    Color.hsv(0, 0.74, 0.95),
    Color.hsv(54, 0.58, 0.97),
    Color.hsv(79, 0.59, 0.81),
    Color.hsv(182, 0.4, 0.73),
    Color.hsv(199, 0.27, 0.33),
    Color.hsv(0, 0, 1),
    Color.hsv(0, 0, 1),
    Color.hsv(0, 0, 1),
    Color.hsv(0, 0, 1),
    Color.hsv(0, 0, 1)
  ]

  constructor() {
    super()
    this.brushColor = this.palette[this.paletteIndex]
    Picture.current = this.picture
    if(this.currentTool instanceof BaseBrushTool) {
      const tool = this.currentTool as BaseBrushTool
      tool.color = this.brushColor.toRgb()
    }

    new NavigationKeyBinding(klass => {
      if (klass) {
        for (const tool of this.tools) {
          if (tool instanceof klass) {
            this.overrideTool = tool
          }
        }
      } else {
        this.overrideTool = undefined
      }
      this.forceUpdate()
    })
  }
  render() {
    const {picture, tools, currentTool, overrideTool} = this
    const onToolChange = (tool: Tool) => {
      this.currentTool = tool
      if(this.currentTool instanceof BaseBrushTool) {
        const tool = this.currentTool as BaseBrushTool
        tool.color = this.brushColor.toRgb()
      }
      this.forceUpdate()
    }
    const onToolContextMenu = (selectedTool: Tool, e: React.MouseEvent<Element>) => {
      e.preventDefault()
      const removeTool = () => {
        this.tools = this.tools.filter((tool) => {
          return tool !== selectedTool
        })
        this.forceUpdate()
      }
      const appendTool = (item: Tool) => {
        return () => {
          const index = this.tools.indexOf(selectedTool) + 1
          this.tools.splice(index, 0, item)
          this.forceUpdate()
        }
      }
      const menuTemplate = [
        {label: '追加', submenu: [
          {label: "BrushTool", click: appendTool(new BrushTool())},
          {label: "WatercolorTool", click: appendTool(new WatercolorTool())}
        ]},
        {label: '削除', click: removeTool}
      ]
      const menu = Menu.buildFromTemplate(menuTemplate)
      menu.popup(remote.getCurrentWindow())
    }
    const onBrushColorChange = (color: Color) => {
      this.brushColor = this.palette[this.paletteIndex] = color
      if(this.currentTool instanceof BaseBrushTool) {
        const brushTool = this.currentTool as BrushTool
        brushTool.color = color.toRgb()
      }
      this.forceUpdate()
    }
    const onPaletteChange = (index: number) => {
      this.paletteIndex = index
      onBrushColorChange(this.palette[index])
      this.forceUpdate()
    }
    return (
      <div className="App">
        <aside className="RightSidebar">
          <ColorPicker color={this.brushColor} onChange={onBrushColorChange} />
          <Palette palette={this.palette} paletteIndex={this.paletteIndex} onChange={onPaletteChange} />
          <ToolSelection tools={tools} currentTool={currentTool} onChange={onToolChange} onContextMenu={onToolContextMenu} />
          {currentTool.renderSettings()}
        </aside>
        <DrawArea tool={overrideTool ? overrideTool : currentTool} picture={picture} />
        <aside className="LeftSidebar">
          <Navigator picture={picture} />
          <LayerList picture={picture} />
        </aside>
      </div>
    )
  }
}
