import {computed} from "mobx"
import Layer from "../models/Layer"
import Selection from "../models/Selection"
import {Tile} from "../models/TiledTexture"
import {UndoStack} from "../models/UndoStack"
import {Vec2} from "paintvec"
import React = require("react")
import {appState} from "../state/AppState"
import {SelectionShowMode} from "../views/Renderer"

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
    return appState.currentTool == this
  }

  abstract name: string

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
  previewLayerTile(layer: Layer, tileKey: Vec2): Tile|undefined|false { return false }
  previewSelection(): Selection|false { return false }
  get selectionShowMode(): SelectionShowMode { return "normal" }

  get config(): Object {
    return {}
  }
  set config(config: Object) {
  }
}
export default Tool
