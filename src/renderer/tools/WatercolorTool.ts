import BrushTool from "./BrushTool";
import WatercolorSettings from "../views/WatercolorSettings"
import React = require("react")
import ToolIDs from "./ToolIDs"
import {BrushEngineWatercolor} from "../brush/watercolor/BrushEngineWatercolor"

export default
class WatercolorTool extends BrushTool {
  readonly id = ToolIDs.watercolor
  readonly title = "Watercolor"
  engine = new BrushEngineWatercolor()
  pipeline = this.engine.newPipeline()
  preset = this.engine.newPreset()

  renderSettings() {
    return React.createFactory(WatercolorSettings)({tool: this})
  }
}
