import {Rect, Vec2} from "paintvec"
import Layer, {ImageLayer} from "../models/Layer"
import TiledTexture, {Tile} from "../models/TiledTexture"
import {ChangeLayerImageCommand} from "../commands/LayerCommand"
import {renderer} from "../views/Renderer"
import {Waypoint} from "./Waypoint"
import {BrushPreset} from "./BrushPreset"
import {appState} from "../app/AppState"

declare var requestIdleCallback: any

export abstract class DabRenderer {
  abstract title: string
  layer: ImageLayer|undefined
  private newTiledTexture = new TiledTexture()
  private editedRect: Rect|undefined
  private commitTimeout: number|undefined

  constructor(public preset: BrushPreset) {
  }

  private addEditedRect(rect: Rect) {
    if (this.editedRect) {
      this.editedRect = this.editedRect.union(rect)
    } else {
      this.editedRect = rect
    }
  }

  private renderRect(rect: Rect) {
    if (!this.layer) {
      return
    }
    const {picture} = this.layer
    picture.blender.dirtiness.addRect(rect)
    renderer.addPictureDirtyRect(rect)
    renderer.renderNow()
  }

  private rectForWaypoints(waypoints: Waypoint[]) {
    const rectWidth = this.preset.width + 2
    const rectSize = new Vec2(rectWidth)
    const rects = waypoints.map(w => {
      const topLeft = new Vec2(w.pos.x - rectWidth * 0.5, w.pos.y - rectWidth * 0.5)
      return new Rect(topLeft, topLeft.add(rectSize))
    })
    return Rect.union(...rects)!.intBounding()
  }

  previewLayerTile(layer: Layer, tileKey: Vec2) {
    if (this.layer && layer == this.layer) {
      if (this.newTiledTexture.has(tileKey)) {
        return {tile: this.newTiledTexture.get(tileKey)}
      } else if (this.layer.tiledTexture.has(tileKey)) {
        return {tile: this.layer.tiledTexture.get(tileKey)}
      } else {
        return {tile: undefined}
      }
    }
  }

  start(layer: ImageLayer) {
    this.clearCommitTimeout()
    if (this.layer != layer) {
      this.commit()
      this.layer = layer
    }
  }

  nextWaypoints(waypoints: Waypoint[]) {
    const rect = this.rectForWaypoints(waypoints)
    this.renderWaypoints(waypoints, rect)
    this.addEditedRect(rect)
    this.renderRect(rect)
  }

  private commit() {
    const rect = this.editedRect
    if (!rect) {
      return
    }
    this.editedRect = undefined

    const {layer} = this
    if (!layer) {
      return
    }
    this.layer = undefined
    const {picture} = layer
    const command = new ChangeLayerImageCommand(picture, layer.path, this.title, this.newTiledTexture, rect)
    this.newTiledTexture = new TiledTexture()
    picture.undoStack.push(command)
  }

  private setCommitTimeout() {
    const onCommit = () => {
      requestIdleCallback(() => {
        this.commit()
      })
    }
    this.commitTimeout = setTimeout(onCommit, appState.undoGroupingInterval)
  }

  private clearCommitTimeout() {
    if (this.commitTimeout != undefined) {
      clearTimeout(this.commitTimeout)
      this.commitTimeout = undefined
    }
  }

  endWaypoint() {
    this.setCommitTimeout()
  }

  abstract renderWaypoints(waypoints: Waypoint[], rect: Rect): void

  protected prepareTile(key: Vec2) {
    if (!this.layer) {
      return
    }
    if (this.newTiledTexture.has(key)) {
      return this.newTiledTexture.get(key)
    } else if (this.layer.tiledTexture.has(key)) {
      const tile = this.layer.tiledTexture.get(key).clone()
      this.newTiledTexture.set(key, tile)
      return tile
    } else {
      const tile = new Tile()
      this.newTiledTexture.set(key, tile)
      return tile
    }
  }
}
