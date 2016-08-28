import React = require("react")
import Picture from "../models/Picture"
import Tool from "../models/Tool"
import BrushTool from "../models/BrushTool"
import WatercolorTool from "../models/WatercolorTool"
import BrushSettings from "./BrushSettings"
import WatercolorSettings from "./WatercolorSettings"
import DrawArea from "./DrawArea"

export default
class App extends React.Component<void, void> {
  picture = new Picture()
  //tool = new BrushTool()
  tool = new WatercolorTool()

  render() {
    return (
      <div className="app">
        <WatercolorSettings tool={this.tool} />
        <DrawArea tool={this.tool} picture={this.picture} />
      </div>
    )
  }
}
