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
import {Color} from "../../lib/Color"
import {Vec4} from "../../lib/Geometry"

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

  constructor() {
    super()
    for (const tool of this.tools) {
      tool.picture = this.picture
    }
    if(this.currentTool instanceof BaseBrushTool) {
      const tool = this.currentTool as BaseBrushTool
      const {r, g, b, a} = tool.color
      this.brushColor = Color.rgb(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a)
    }
  }
  render() {
    const {picture, tools, currentTool} = this
    const onToolChange = (tool: Tool) => {
      this.currentTool = tool
      if(this.currentTool instanceof BaseBrushTool) {
        const tool = this.currentTool as BaseBrushTool
        const {r, g, b, a} = tool.color
        this.brushColor = Color.rgb(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a)
      }
      this.forceUpdate()
    }
    const onBrushColorChange = (color: Color) => {
      if(!(this.currentTool instanceof BaseBrushTool))
        return
      this.brushColor = color
      const brushTool = this.currentTool as BrushTool
      const {r, g, b} = color.toRgb()
      brushTool.color = new Vec4(r/255, g/255, b/255, color.a)
      this.forceUpdate()
    }
    return (
      <div className="app">
        <aside className="sidebar">
          <ColorPicker color={this.brushColor} onChange={onBrushColorChange} />
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
