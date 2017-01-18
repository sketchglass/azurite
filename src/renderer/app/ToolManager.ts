import {observable} from "mobx"
import Tool from "../tools/Tool"
import PenTool from "../tools/PenTool"
import WatercolorTool from "../tools/WatercolorTool"
import PanTool from "../tools/PanTool"
import {ZoomTool} from "../tools/ZoomTool"
import RotateTool from "../tools/RotateTool"
import TransformLayerTool from "../tools/TransformLayerTool"
import RectSelectTool from "../tools/RectSelectTool"
import FreehandSelectTool from "../tools/FreehandSelectTool"
import PolygonSelectTool from "../tools/PolygonSelectTool"
import CanvasAreaTool from "../tools/CanvasAreaTool"
import FloodFillTool from "../tools/FloodFillTool"
import {ConfigValues} from "./Config"

export
class ToolManager {
  readonly tools = observable<Tool>([])
  @observable currentTool: Tool
  @observable overrideTool: Tool|undefined

  add(...tools: Tool[]) {
    this.tools.push(...tools)
  }

  initTools() {
    this.tools.replace([
      new PenTool(),
      new WatercolorTool(),
      new PanTool(),
      new ZoomTool(),
      new RotateTool(),
      new TransformLayerTool(),
      new RectSelectTool("rect"),
      new RectSelectTool("ellipse"),
      new FreehandSelectTool(),
      new PolygonSelectTool(),
      new FloodFillTool(),
      new CanvasAreaTool(),
    ])
    this.currentTool = this.tools[0]
  }

  loadConfig(values: ConfigValues) {
    for (const toolId in values.tools) {
      const tool = this.tools.find(t => t.id == toolId)
      if (tool) {
        tool.config = values.tools[toolId]
      }
    }
    const currentTool = this.tools.find(t => t.id == values.currentTool)
    if (currentTool) {
      this.currentTool = currentTool
    }
  }

  saveConfig() {
    const tools = {}
    for (const tool of this.tools) {
      tools[tool.id] = tool.config
    }
    return {
      tools,
      currentTool: this.currentTool.id,
    }
  }
}

export const toolManager = new ToolManager()
