import {computed, observable} from "mobx"
import Layer from "../models/Layer"
import Selection from "../models/Selection"
import {Tile} from "../models/TiledTexture"
import {UndoStack} from "../models/UndoStack"
import {Vec2} from "paintvec"
import React = require("react")
import {appState} from "../app/AppState"
import {SelectionShowMode} from "../views/Renderer"
import {toolManager} from "../app/ToolManager"
import KeyInput, {KeyInputData} from "../../lib/KeyInput"

export
interface ToolConfigData {
  shortcut: KeyInputData|undefined
  tempShortcut: KeyInputData|undefined
}

export
interface ToolPointerEvent {
  rendererPos: Vec2
  picturePos: Vec2
  pressure: number
  button: number
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
}

abstract class Tool {
  @computed get picture() {
    return appState.currentPicture
  }
  @computed get currentLayer() {
    if (this.picture) {
      return this.picture.currentLayer
    }
  }
  @computed get selectedLayers() {
    if (this.picture) {
      return this.picture.selectedLayers.peek()
    } else {
      return []
    }
  }
  @computed get active() {
    return toolManager.currentTool == this
  }

  abstract id: string
  abstract title: string

  get cursor() {
    return "auto"
  }
  get cursorImage(): HTMLCanvasElement|undefined {
    return undefined
  }
  get cursorImageSize() {
    return 0
  }

  get modal() { return false }
  get modalUndoStack(): UndoStack|undefined { return }

  abstract start(event: ToolPointerEvent): void
  abstract move(event: ToolPointerEvent): void
  abstract end(event: ToolPointerEvent): void
  hover(event: ToolPointerEvent) {}
  keyDown(event: React.KeyboardEvent<HTMLElement>) {}

  renderSettings(): JSX.Element { return React.createElement("div") }
  renderOverlayCanvas?(context: CanvasRenderingContext2D): void
  previewLayerTile(layer: Layer, tileKey: Vec2): {tile: Tile|undefined}|undefined { return }
  previewSelection(): Selection|false { return false }
  get selectionShowMode(): SelectionShowMode { return "normal" }

  @observable shortcut: KeyInput|undefined
  @observable tempShortcut: KeyInput|undefined

  getConfig(): ToolConfigData {
    const shortcut = this.shortcut && this.shortcut.toData()
    const tempShortcut = this.shortcut && this.shortcut.toData()
    return {shortcut, tempShortcut}
  }
  setConfig(config: ToolConfigData) {
    this.shortcut = config.shortcut ? KeyInput.fromData(config.shortcut) : undefined
    this.tempShortcut = config.tempShortcut ? KeyInput.fromData(config.tempShortcut) : undefined
  }
}
export default Tool
