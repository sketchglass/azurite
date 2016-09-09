import React = require("react")
import Picture from "../models/Picture"
import Tool from "../models/Tool"
import BrushTool from "../models/BrushTool"
import WatercolorTool from "../models/WatercolorTool"
import BrushSettings from "./BrushSettings"
import WatercolorSettings from "./WatercolorSettings"
import DrawArea from "./DrawArea"
import LayerList from "./LayerList"

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

  render() {
    const {picture, tools, currentTool} = this
    const onToolChange = (tool: Tool) => {
      this.currentTool = tool
      this.forceUpdate()
    }
    return (
      <div className="app">
        <aside className="sidebar">
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
