import {observable, computed, reaction} from "mobx"
import {remote} from "electron"
const {dialog} = remote
import Picture from "../models/Picture"
import Tool from "../tools/Tool"
import BrushTool from "../tools/BrushTool"
import WatercolorTool from "../tools/WatercolorTool"
import PanTool from "../tools/PanTool"
import {ZoomTool} from "../tools/ZoomTool"
import RotateTool from "../tools/RotateTool"
import TransformLayerTool from "../tools/TransformLayerTool"
import {HSVColor} from "../../lib/Color"
import {PictureSave} from "../services/PictureSave"

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
    new TransformLayerTool(this),
  ])
  @observable currentTool: Tool = this.tools[0]
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
    reaction(() => [this.currentPicture, this.currentTool], () => {
      const hook = this.currentTool.hookLayerBlend.bind(this.currentTool)
      for (const picture of this.pictures) {
        if (picture == this.currentPicture) {
          picture.layerBlender.hook = hook
        } else {
          picture.layerBlender.hook = undefined
        }
      }
    })
  }

  async closePicture(index: number) {
    const picture = appState.pictures[index]
    if (picture.edited) {
      const resultIndex = dialog.showMessageBox(remote.getCurrentWindow(), {
        buttons: ["Save", "Cancel", "Don't Save"],
        defaultId: 0,
        message: `Do you want to save changes to ${picture.fileName}?`,
        detail: "Your changes will be lost without saving.",
        cancelId: 1,
      })
      if (resultIndex == 1) {
        return false
      }
      if (resultIndex == 0) {
        const saved = await new PictureSave(picture).save()
        if (!saved) {
          return false
        }
      }
    }
    appState.pictures.splice(index, 1)
    picture.dispose()
    if (this.pictures.length <= this.currentPictureIndex) {
      this.currentPictureIndex = this.pictures.length - 1
    }
    return true
  }

  async closePictures() {
    for (let i = this.pictures.length - 1; i >= 0; --i) {
      if (!await this.closePicture(i)) {
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

window.addEventListener("beforeunload", e => {
  // Do not close window immediately https://github.com/electron/electron/blob/master/docs/api/browser-window.md#event-close
  e.returnValue = false
  appState.quit()
})
