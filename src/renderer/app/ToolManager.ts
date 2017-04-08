import {observable} from 'mobx'
import BrushTool from '../tools/BrushTool'
import CanvasAreaTool from '../tools/CanvasAreaTool'
import FloodFillTool from '../tools/FloodFillTool'
import FreehandSelectTool from '../tools/FreehandSelectTool'
import PanTool from '../tools/PanTool'
import PolygonSelectTool from '../tools/PolygonSelectTool'
import RectSelectTool from '../tools/RectSelectTool'
import RotateTool from '../tools/RotateTool'
import Tool from '../tools/Tool'
import TransformLayerTool from '../tools/TransformLayerTool'
import {ZoomTool} from '../tools/ZoomTool'
import {ConfigValues} from './Config'

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
      new PanTool(),
      new ZoomTool(),
      new RotateTool(),
      new TransformLayerTool(),
      new RectSelectTool('rect'),
      new RectSelectTool('ellipse'),
      new FreehandSelectTool(),
      new PolygonSelectTool(),
      new FloodFillTool(),
      new CanvasAreaTool(),
      new BrushTool(),
    ])
    this.currentTool = this.tools[0]
  }

  loadConfig(values: ConfigValues) {
    for (const toolId in values.tools) {
      const tool = this.tools.find(t => t.id === toolId)
      if (tool) {
        tool.loadConfig(values.tools[toolId])
      }
    }
    const currentTool = this.tools.find(t => t.id === values.currentTool)
    if (currentTool) {
      this.currentTool = currentTool
    }
  }

  saveConfig() {
    const tools = {}
    for (const tool of this.tools) {
      tools[tool.id] = tool.saveConfig()
    }
    return {
      tools,
      currentTool: this.currentTool.id,
    }
  }
}

export const toolManager = new ToolManager()
