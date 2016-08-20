import React = require("react")
import BrushTool from "../models/BrushTool"

interface BrushSettingsProps {
  tool: BrushTool
}

export default
class BrushSettings extends React.Component<BrushSettingsProps, void> {
  constructor() {
    super();
  }

  render() {
    const {tool} = this.props
    const onColorChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.color = ev.target.value
      this.forceUpdate()
    }
    const onWidthChange = (ev: React.FormEvent<HTMLInputElement>) => {
      tool.width = parseInt(ev.target.value)
      this.forceUpdate()
    }
    return (
      <div className="brush-settings">
        <p>Color <input type="color" onChange={onColorChange} value={tool.color} /></p>
        <p>Width <input type="range" onChange={onWidthChange} value={tool.width} /> {tool.width}px</p>
      </div>
    )
  }
}
