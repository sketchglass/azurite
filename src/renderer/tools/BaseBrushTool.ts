import {observable, action, autorun, computed} from "mobx"
import {Vec2} from "paintvec"
import {Waypoint} from "../brush/Waypoint"
import Tool, {ToolPointerEvent} from "./Tool"
import Layer, {ImageLayer} from "../models/Layer"
import {BrushPipeline} from "../brush/BrushPipeline"
import {BrushPreset} from "../brush/BrushPreset"

abstract class BaseBrushTool extends Tool {
  @observable dragged = false

  private _cursorImage = document.createElement("canvas")
  @observable private _cursorImageSize = 0
  private cursorContext = this._cursorImage.getContext("2d")!

  get cursor() {
    return "not-allowed"
  }
  @computed get cursorImage() {
    if (this.currentLayer && this.currentLayer instanceof ImageLayer) {
      return this._cursorImage
    }
  }
  @computed get cursorImageSize() {
    return this._cursorImageSize
  }

  @computed get selectionShowMode() {
    if (this.dragged) {
      return "stopped"
    } else {
      return "normal"
    }
  }

  abstract preset: BrushPreset
  abstract pipeline: BrushPipeline

  constructor() {
    super()
    setImmediate(() => {
      autorun(() => this.updateCursor())
    })
  }

  updateCursor() {
    const scale = this.picture ? this.picture.navigation.scale : 1
    const radius = this.preset.width / 2 * scale
    const dpr = window.devicePixelRatio
    const canvasSize = (radius * 2 + 4) * dpr
    const center = canvasSize / 2
    this._cursorImage.width = canvasSize
    this._cursorImage.height = canvasSize

    const context = this.cursorContext

    context.lineWidth = dpr
    context.strokeStyle = "rgba(0,0,0,0.5)"

    context.beginPath()
    context.ellipse(center, center, radius, radius, 0, 0, 2 * Math.PI)
    context.stroke()

    context.strokeStyle = "rgba(255,255,255,0.5)"
    context.beginPath()
    context.ellipse(center, center, radius + dpr, radius + dpr, 0, 0, 2 * Math.PI)
    context.stroke()

    this._cursorImageSize = canvasSize
  }

  previewLayerTile(layer: Layer, tileKey: Vec2) {
    return this.pipeline.dabRenderer.previewLayerTile(layer, tileKey)
  }

  @action start(ev: ToolPointerEvent) {
    const layer = this.currentLayer
    if (!(layer && layer instanceof ImageLayer)) {
      return
    }
    this.dragged = true
    this.pipeline.dabRenderer.preset = this.preset
    this.pipeline.dabRenderer.start(layer)
    this.pipeline.nextWaypoints([new Waypoint(ev.picturePos, ev.pressure)])
  }

  @action move(ev: ToolPointerEvent) {
    if (this.dragged) {
      this.pipeline.nextWaypoints([new Waypoint(ev.picturePos, ev.pressure)])
    }
  }

  @action end() {
    if (this.dragged) {
      this.pipeline.endWaypoint()
      this.dragged = false
    }
  }
}

export default BaseBrushTool
