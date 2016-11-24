import {observable, computed} from "mobx"
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import Renderer from "../views/Renderer"
import Waypoint from "../models/Waypoint"
import {TileBlender} from "../models/LayerBlender"
import {Tile} from "../models/TiledTexture"
import {UndoStack} from "../models/UndoStack"
import {Vec2} from "paintvec"
import React = require("react")
import {AppState} from "../state/AppState"

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
  constructor(public appState: AppState) {
  }

  @computed get picture() {
    return this.appState.currentPicture
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
    return this.appState.currentTool == this
  }
  renderer: Renderer

  abstract name: string

  @observable cursor = "auto"
  @observable cursorElement: HTMLElement|undefined
  @observable cursorElementSize = 0

  get modal() { return false }
  get modalUndoStack(): UndoStack|undefined { return }

  abstract start(event: ToolPointerEvent): void
  abstract move(event: ToolPointerEvent): void
  abstract end(): void
  keyDown(event: React.KeyboardEvent<HTMLElement>) {}

  renderSettings(): JSX.Element { return React.createElement("div") }
  renderOverlayUI(): JSX.Element|undefined { return }
  hookLayerRender(layer: Layer, tileKey: Vec2): {hooked: boolean, tile?: Tile} {
    return {hooked: false}
  }
}
export default Tool
