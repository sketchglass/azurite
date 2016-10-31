import {observable, computed} from "mobx"
import Picture from "../models/Picture"
import Tool from "../tools/Tool"
import BrushTool from "../tools/BrushTool"
import WatercolorTool from "../tools/WatercolorTool"
import PanTool from "../tools/PanTool"
import {ZoomTool} from "../tools/ZoomTool"
import RotateTool from "../tools/RotateTool"
import {HSVColor} from "../../lib/Color"

export
class AppState {
  readonly pictures = observable<Picture>([])
  @observable currentPictureIndex = 0

  @computed get currentPicture(): Picture|undefined {
    const i = this.currentPictureIndex
    if (i < this.pictures.length) {
      return this.pictures[i]
    }
  }

  readonly tools = observable<Tool>([
    new BrushTool(this),
    new WatercolorTool(this),
    new PanTool(this),
    new ZoomTool(this),
    new RotateTool(this),
  ])
  @observable currentTool: Tool = this.tools[0]
  @observable overrideTool: Tool|undefined

  @observable color = new HSVColor(0, 0, 1)
  @observable paletteIndex: number = 0
  readonly palette = observable<HSVColor>(new Array(100).fill(new HSVColor(0, 0, 1)))
}

export const appState = new AppState()
