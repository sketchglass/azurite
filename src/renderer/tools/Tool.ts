import {observable, computed} from "mobx"
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import Renderer from "../views/Renderer"
import Waypoint from "../models/Waypoint"
import {TileBlender} from "../models/LayerBlender"
import {Tile} from "../models/TiledTexture"
import {Vec2} from "paintvec"
import React = require("react")
import {AppState} from "../state/AppState"

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
  renderer: Renderer
  abstract name: string
  @observable cursor = "auto"
  @observable cursorElement: HTMLElement|undefined
  @observable cursorElementSize = 0
  abstract start(waypoint: Waypoint, rendererPos: Vec2): void
  abstract move(waypoint: Waypoint, rendererPos: Vec2): void
  abstract end(): void
  cursorMove(waypoint: Waypoint) {}
  renderSettings(): JSX.Element { return React.createElement("div") }
  hookLayerBlend(layer: Layer, tileKey: Vec2, tile: Tile|undefined, tileBlender: TileBlender){ return false }
}
export default Tool
