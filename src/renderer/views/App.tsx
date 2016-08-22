import React = require("react")
import Picture from "../models/Picture"
import Tool from "../models/Tool"
import BrushTool from "../models/BrushTool"
import BrushSettings from "./BrushSettings"
import DrawArea from "./DrawArea"

export default
class App extends React.Component<void, void> {
  picture = new Picture()
  tool = new BrushTool()

  render() {
    return (
      <div className="app">
        <BrushSettings tool={this.tool} />
        <DrawArea tool={this.tool} picture={this.picture} />
      </div>
    )
  }
}
