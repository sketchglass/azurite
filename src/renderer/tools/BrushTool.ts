import BaseBrushTool from "./BaseBrushTool";
import BrushSettings from "../views/BrushSettings"
import React = require("react")
import ToolIDs from "./ToolIDs"
import {BrushEnginePen} from "../brush/pen/BrushEnginePen"

export default
class BrushTool extends BaseBrushTool {
  readonly id = ToolIDs.brush
  readonly title = "Brush"
  engine = new BrushEnginePen()
  pipeline = this.engine.newPipeline()
  preset = this.engine.newPreset()

  renderSettings() {
    return React.createFactory(BrushSettings)({tool: this})
  }
}
