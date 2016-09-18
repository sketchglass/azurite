import React = require("react")
import Picture from "../models/Picture"
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
import {Color} from "../../lib/Color"
import {Vec4} from "../../lib/Geometry"
import "./MenuBar"
import "../../styles/palette.sass"

function ToolSelection(props: {tools: Tool[], currentTool: Tool, onChange: (tool: Tool) => void}) {
  return (
    <div className="tool-selection">{
      props.tools.map((tool, i) => {
        const onChange = () => props.onChange(tool)
        return <label key={i}><input type="radio" checked={tool == props.currentTool} onChange={onChange}/>{tool.name}</label>
      })
    }</div>
  )
}

export default
class App extends React.Component<void, void> {
  picture = new Picture()
  tools: Tool[] = [new BrushTool(), new WatercolorTool()]
  currentTool = this.tools[0]
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
    for (const tool of this.tools) {
      tool.picture = this.picture
    }
    Picture.current = this.picture
    if(this.currentTool instanceof BaseBrushTool) {
      const tool = this.currentTool as BaseBrushTool
      tool.color = this.brushColor.toRgb()
    }
  }
  render() {
    const {picture, tools, currentTool} = this
    const onToolChange = (tool: Tool) => {
      this.currentTool = tool
      if(this.currentTool instanceof BaseBrushTool) {
        const tool = this.currentTool as BaseBrushTool
        tool.color = this.brushColor.toRgb()
      }
      this.forceUpdate()
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
      <div className="app">
        <aside className="sidebar">
          <ColorPicker color={this.brushColor} onChange={onBrushColorChange} />
          <Palette palette={this.palette} paletteIndex={this.paletteIndex} onChange={onPaletteChange} />
          <ToolSelection tools={tools} currentTool={currentTool} onChange={onToolChange} />
          {currentTool.renderSettings()}
        </aside>
        <DrawArea tool={currentTool} picture={picture} />
        <aside className="LeftSidebar">
          <LayerList picture={picture} />
        </aside>
      </div>
    )
  }
}
