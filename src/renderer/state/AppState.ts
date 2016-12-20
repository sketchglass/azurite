import {observable, computed, reaction} from "mobx"
import {remote} from "electron"
import Tool from "../tools/Tool"
import BrushTool from "../tools/BrushTool"
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
import {HSVColor} from "../../lib/Color"
import {PictureState} from "./PictureState"
import * as IPCChannels from "../../common/IPCChannels"

export
class AppState {
  readonly pictureStates = observable<PictureState>([])
  @observable currentPictureIndex = 0

  @computed get currentPictureState() {
    const i = this.currentPictureIndex
    if (i < this.pictureStates.length) {
      return this.pictureStates[i]
    }
  }

  @computed get currentPicture() {
    return this.currentPictureState && this.currentPictureState.picture
  }

  readonly tools = observable<Tool>([])
  @observable currentTool: Tool
  @observable overrideTool: Tool|undefined

  @observable color = new HSVColor(0, 0, 1)
  @observable paletteIndex: number = 0
  readonly palette = observable<HSVColor>(new Array(100).fill(HSVColor.transparent))

  @computed get modal() {
    return this.currentTool.modal
  }
  @computed get modalUndoStack() {
    return this.currentTool.modalUndoStack
  }

  constructor() {
    reaction(() => [this.currentPictureState, this.currentTool], () => {
      for (const pictureState of this.pictureStates) {
        if (pictureState == this.currentPictureState) {
          pictureState.picture.layerBlender.replaceTile = (layer, tileKey) => this.currentTool.previewLayerTile(layer, tileKey)
        } else {
          pictureState.picture.layerBlender.replaceTile = undefined
        }
      }
    })
  }

  initTools() {
    this.tools.replace([
      new BrushTool(),
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

  addPictureState(pictureState: PictureState) {
    this.pictureStates.push(pictureState)
    this.currentPictureIndex = this.pictureStates.length - 1
  }

  async newPicture() {
    const pictureState = await PictureState.new()
    if (pictureState) {
      this.addPictureState(pictureState)
    }
  }

  async openPicture() {
    const pictureState = await PictureState.open()
    if (pictureState) {
      this.addPictureState(pictureState)
    }
  }

  async closePicture(index: number) {
    if (this.pictureStates.length <= index) {
      return
    }
    const pictureState = this.pictureStates[index]
    if (!pictureState.confirmClose()) {
      return
    }
    this.pictureStates.splice(index, 1)
    pictureState.dispose()
    if (this.pictureStates.length <= this.currentPictureIndex) {
      this.currentPictureIndex = this.pictureStates.length - 1
    }
    return true
  }

  async closePictures() {
    for (const pictureState of this.pictureStates) {
      if (!await pictureState.confirmClose()) {
        return false
      }
    }
    return true
  }

  async quit() {
    // TODO: save app state
    if (await appState.closePictures()) {
      remote.getCurrentWindow().destroy()
      return true
    }
    return false
  }
}

export const appState = new AppState()
appState.initTools()

IPCChannels.quit.listen().forEach(() => {
  appState.quit()
})
