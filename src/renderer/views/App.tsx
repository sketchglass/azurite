import React = require("react")
import Picture from "../models/Picture"
import Tool from "../models/Tool"
import BrushTool from "../models/BrushTool"
import WatercolorTool from "../models/WatercolorTool"
import BrushSettings from "./BrushSettings"
import WatercolorSettings from "./WatercolorSettings"
import DrawArea from "./DrawArea"
import ColorPicker from "./ColorPicker"
import {Color} from "../../lib/Color"

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

interface AppState {
  brushColor: Color
}

export default
class App extends React.Component<void, AppState> {
  picture = new Picture()
  tools: Tool[] = [new BrushTool(), new WatercolorTool()]
  currentTool = this.tools[0]

  constructor () {
    super()
    this.state = {
      brushColor: new Color(0, 0, 0, 0)
    }
  }

  render() {
    const {picture, tools, currentTool} = this
    const onToolChange = (tool: Tool) => {
      this.currentTool = tool
      this.forceUpdate()
    }
    return (
      <div className="app">
        <aside className="sidebar">
          <ColorPicker color={this.state.brushColor} onChange={(color: Color)=>{this.setState({brushColor: color})}} />
          <ToolSelection tools={tools} currentTool={currentTool} onChange={onToolChange} />
          {currentTool.renderSettings()}
        </aside>
        <DrawArea tool={currentTool} picture={picture} />
      </div>
    )
  }
}
