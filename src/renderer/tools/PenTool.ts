import BrushTool from "./BrushTool";
import PenSettings from "../views/PenSettings"
import React = require("react")
import ToolIDs from "./ToolIDs"
import {BrushEnginePen} from "../brush/pen/BrushEnginePen"

export default
class PenTool extends BrushTool {
  readonly id = ToolIDs.pen
  readonly title = "Pen"
  engine = new BrushEnginePen()
  pipeline = this.engine.newPipeline()
  preset = this.engine.newPreset()

  renderSettings() {
    return React.createFactory(PenSettings)({tool: this})
  }
}
