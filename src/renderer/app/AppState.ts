import * as path from "path"
import {observable, computed, reaction} from "mobx"
import {remote, ipcRenderer} from "electron"
import Picture from "../models/Picture"
import {HSVColor} from "../../lib/Color"
import {PictureState} from "./PictureState"
import {PictureSave} from "../services/PictureSave"
import {config, ConfigValues} from "./Config"
import IPCChannels from "../../common/IPCChannels"
import "../formats/PictureFormatCanvasImage"
import "../actions/AppActions"
import "../actions/FileActions"
import "../actions/LayerActions"
import "../actions/EditActions"
import "../actions/SelectionAction"
import "../actions/CanvasActions"
import "../actions/ViewActions"
import {toolManager} from "./ToolManager"
import {brushPresetManager} from "./BrushPresetManager"

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

  @observable color = new HSVColor(0, 0, 1)
  @observable paletteIndex: number = 0
  readonly palette = observable<HSVColor|undefined>(new Array(100).fill(undefined))

  @observable undoGroupingInterval = 300

  @computed get modal() {
    return toolManager.currentTool.modal
  }
  @computed get modalUndoStack() {
    return toolManager.currentTool.modalUndoStack
  }

  @computed get undoStack() {
    const {modal, modalUndoStack, currentPictureState} = this
    if (modal) {
      return modalUndoStack
    }
    if (currentPictureState) {
      return currentPictureState.picture.undoStack
    }
  }

  @observable uiVisible = true

  constructor() {
    reaction(() => this.currentPictureState, () => {
      for (const pictureState of this.pictureStates) {
        if (pictureState == this.currentPictureState) {
          pictureState.picture.blender.tileHook = (layer, tileKey) => toolManager.currentTool.previewLayerTile(layer, tileKey)
        } else {
          pictureState.picture.blender.tileHook = undefined
        }
      }
    })
  }

  toggleUIVisible() {
    this.uiVisible = !this.uiVisible
  }

  async bootstrap() {
    await this.loadConfig()
  }

  async loadConfig() {
    const {values} = config
    const win = remote.getCurrentWindow()
    win.setFullScreen(values.window.fullscreen)
    if (values.window.bounds) {
      win.setBounds(values.window.bounds)
    }
    if (values.window.maximized) {
      win.maximize()
    }
    toolManager.loadConfig(values)
    brushPresetManager.loadConfig(values)
    this.color = new HSVColor(values.color.h, values.color.s, values.color.v)
    for (const [i, color] of values.palette.entries()) {
      this.palette[i] = color ? new HSVColor(color.h, color.s, color.v) : undefined
    }
    for (const filePath of values.files) {
      const pictureState = new PictureState(await PictureSave.openFromPath(filePath))
      if (pictureState) {
        this.addPictureState(pictureState)
      }
      this.openPicture
    }
  }

  saveConfig() {
    const colorToData = (color: HSVColor) => {
      const {h, s, v} = color
      return {h, s, v}
    }
    const win = remote.getCurrentWindow()
    const values: ConfigValues = {
      window: {
        fullscreen: win.isFullScreen(),
        bounds: (win.isFullScreen() || win.isMaximized()) ? config.values.window.bounds : win.getBounds(),
        maximized: win.isMaximized(),
      },
      ...toolManager.saveConfig(),
      ...brushPresetManager.saveConfig(),
      color: colorToData(this.color),
      palette: this.palette.map(color => {
        if (color) {
          return colorToData(color)
        }
      }),
      files: this.pictureStates
        .map(state => state.picture.filePath)
        .filter(path => path)
    }
    config.values = values
  }

  addPictureState(pictureState: PictureState) {
    this.pictureStates.push(pictureState)
    this.currentPictureIndex = this.pictureStates.length - 1
  }

  stateForPicture(picture: Picture) {
    for (const state of this.pictureStates) {
      if (state.picture == picture) {
        return state
      }
    }
  }

  async newPicture() {
    const pictureState = await PictureState.new()
    if (pictureState) {
      this.addPictureState(pictureState)
    }
  }

  async openPicture() {
    const filePath = await PictureSave.getOpenPath()
    if (!filePath) {
      return
    }
    const pictureState = this.pictureStates.find(s => path.resolve(s.picture.filePath) == path.resolve(filePath))
    if (pictureState) {
      this.currentPictureIndex = this.pictureStates.indexOf(pictureState)
    } else {
      const picture = await PictureSave.openFromPath(filePath)
      this.addPictureState(new PictureState(picture))
    }
  }

  async closePicture(index: number) {
    if (this.pictureStates.length <= index) {
      return
    }
    const pictureState = this.pictureStates[index]
    if (!await pictureState.confirmClose()) {
      return
    }
    this.pictureStates.splice(index, 1)
    pictureState.dispose()
    if (this.pictureStates.length <= this.currentPictureIndex) {
      this.currentPictureIndex = this.pictureStates.length - 1
    }
    return true
  }

  async confirmClosePictures() {
    for (const pictureState of this.pictureStates) {
      if (!await pictureState.confirmClose()) {
        return false
      }
    }
    return true
  }

  async prepareQuit() {
    const ok = await appState.confirmClosePictures()
    this.saveConfig()
    return ok
  }

  async quit() {
    if (await this.prepareQuit()) {
      remote.getCurrentWindow().destroy()
      return true
    }
    return false
  }

  async reload() {
    if (await appState.prepareQuit()) {
      location.reload()
      return true
    }
    return false
  }
}

export const appState = new AppState()
toolManager.initTools()

ipcRenderer.on(IPCChannels.windowResize, () => {
  appState.saveConfig()
})
ipcRenderer.on(IPCChannels.quit, () => {
  appState.quit()
})
