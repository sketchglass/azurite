import {observable, action, autorun, computed} from "mobx"
import {Vec2, Rect} from "paintvec"
import Waypoint from "../models/Waypoint"
import Tool, {ToolPointerEvent} from "./Tool"
import Layer, {ImageLayer} from "../models/Layer"
import TiledTexture, {Tile} from "../models/TiledTexture"
import {ChangeLayerImageCommand} from "../commands/LayerCommand"
import {renderer} from "../views/Renderer"

function stabilizeWaypoint(waypoints: Waypoint[], level: number, index: number) {
  const nWaypoints = waypoints.length
  let sumX = 0
  let sumY = 0
  let sumPressure = 0
  for (let i = index - level; i <= index + level; ++i) {
    const {pos: {x, y}, pressure} = waypoints[Math.max(0, Math.min(i, nWaypoints - 1))]
    sumX += x
    sumY += y
    sumPressure += pressure
  }
  const sumCount = level * 2 + 1
  const pos = new Vec2(sumX / sumCount, sumY / sumCount)
  const pressure = sumPressure / sumCount
  return new Waypoint(pos, pressure)
}

abstract class BaseBrushTool extends Tool {
  private lastStabilizeWaypoints: Waypoint[] = []
  private lastInterpolateWaypoints: Waypoint[] = []
  private nextDabOffset = 0

  // brush width (diameter)
  @observable width = 10
  // brush opacity
  @observable opacity = 1
  // distance used to soften edge, compared to brush radius
  @observable softness = 0.5
  // width drawn in pressure 0, compared to brush width
  @observable minWidthRatio = 0.5
  // spacing between dabs, compared to brush width
  @observable spacingRatio = 0.1

  // how many neighbor event positions used to stabilize stroke
  @observable stabilizingLevel = 2

  @observable targetLayer: ImageLayer|undefined
  private newTiledTexture = new TiledTexture()
  private editedRect: Rect|undefined

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
    if (this.targetLayer) {
      return "stopped"
    } else {
      return "normal"
    }
  }

  constructor() {
    super()
    autorun(() => this.updateCursor())
  }

  updateCursor() {
    const scale = this.picture ? this.picture.navigation.scale : 1
    const radius = this.width / 2 * scale
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

  private addEditedRect(rect: Rect) {
    if (this.editedRect) {
      this.editedRect = this.editedRect.union(rect)
    } else {
      this.editedRect = rect
    }
  }

  private renderRect(rect: Rect) {
    if (!this.picture) {
      return
    }
    this.picture.blender.dirtiness.addRect(rect)
    renderer.addPictureDirtyRect(rect)
    renderer.renderNow()
  }

  previewLayerTile(layer: Layer, tileKey: Vec2) {
    if (this.targetLayer && layer == this.targetLayer) {
      if (this.newTiledTexture.has(tileKey)) {
        return this.newTiledTexture.get(tileKey)
      } else if (this.targetLayer.tiledTexture.has(tileKey)) {
        return this.targetLayer.tiledTexture.get(tileKey)
      } else {
        return undefined
      }
    } else {
      return false
    }
  }

  start(ev: ToolPointerEvent) {
    const layer = this.currentLayer
    if (!(layer && layer instanceof ImageLayer)) {
      return
    }
    this.targetLayer = layer
    this.newTiledTexture.clear()

    this.lastStabilizeWaypoints = []
    this.lastInterpolateWaypoints = []

    this.stabilizeMove(new Waypoint(ev.picturePos, ev.pressure))
  }

  move(ev: ToolPointerEvent) {
    this.stabilizeMove(new Waypoint(ev.picturePos, ev.pressure))
  }

  @action end() {
    this.stabilizeEnd()
    this.pushUndoStack()
    if (this.targetLayer) {
      this.targetLayer = undefined
    }
  }

  private stabilizeMove(waypoint: Waypoint) {
    const waypoints = this.lastStabilizeWaypoints
    waypoints.push(waypoint)
    const level = this.stabilizingLevel
    const sumCount = level * 2 + 1
    if (sumCount == waypoints.length) {
      for (let i = 0; i < level; ++i) {
        this.interpolateMove(stabilizeWaypoint(waypoints, level, i))
      }
    }
    if (sumCount <= waypoints.length) {
      const i = waypoints.length - 1 - level
      this.interpolateMove(stabilizeWaypoint(waypoints, level, i))
    }
  }

  private stabilizeEnd() {
    const waypoints = this.lastStabilizeWaypoints
    const level = this.stabilizingLevel
    let firstUndrawnIndex = 0
    if (level * 2 + 1 <= waypoints.length) {
      firstUndrawnIndex = waypoints.length - level
    }
    for (let i = firstUndrawnIndex; i < waypoints.length; ++i) {
      this.interpolateMove(stabilizeWaypoint(waypoints, level, i))
    }
    this.interpolateEnd()
  }

  private interpolateMove(waypoint: Waypoint) {
    const lastWaypoints = this.lastInterpolateWaypoints
    if (lastWaypoints.length == 4) {
      lastWaypoints.shift()
    }
    lastWaypoints.push(waypoint)

    const getSpacing = this.brushSpacing.bind(this)
    const {waypoints, nextOffset} = (() => {
      switch (lastWaypoints.length) {
        case 1:
          return {waypoints: [waypoint], nextOffset: this.brushSpacing(waypoint)}
        case 2:
          return {waypoints: [], nextOffset: this.nextDabOffset}
        case 3:
          return Waypoint.subdivideCurve(lastWaypoints[0], lastWaypoints[0], lastWaypoints[1], lastWaypoints[2], getSpacing, this.nextDabOffset)
        default:
          return Waypoint.subdivideCurve(lastWaypoints[0], lastWaypoints[1], lastWaypoints[2], lastWaypoints[3], getSpacing, this.nextDabOffset)
      }
    })()

    this.nextDabOffset = nextOffset

    if (waypoints.length == 0) {
      return
    }
    const rect = this._rectForWaypoints(waypoints)
    this.renderWaypoints(waypoints, rect)
    this.addEditedRect(rect)
    this.renderRect(rect)
  }

  private interpolateEnd() {
    const getSpacing = this.brushSpacing.bind(this)
    const lastWaypoints = this.lastInterpolateWaypoints
    if (lastWaypoints.length < 2) {
      return
    }
    const {waypoints} = (() => {
      if (lastWaypoints.length == 2) {
        return Waypoint.subdivide(lastWaypoints[0], lastWaypoints[1], getSpacing, this.nextDabOffset)
      } else if (lastWaypoints.length == 3) {
        return Waypoint.subdivideCurve(lastWaypoints[0], lastWaypoints[1], lastWaypoints[2], lastWaypoints[2], getSpacing, this.nextDabOffset)
      } else {
        return Waypoint.subdivideCurve(lastWaypoints[1], lastWaypoints[2], lastWaypoints[3], lastWaypoints[3], getSpacing, this.nextDabOffset)
      }
    })()

    if (waypoints.length != 0) {
      const rect = this._rectForWaypoints(waypoints)
      this.renderWaypoints(waypoints, rect)
      this.addEditedRect(rect)
      this.renderRect(rect)
    }
  }

  private pushUndoStack() {
    const rect = this.editedRect
    if (!rect) {
      return
    }
    this.editedRect = undefined

    const layer = this.targetLayer
    if (!layer) {
      return
    }
    const {picture} = layer
    const command = new ChangeLayerImageCommand(picture, layer.path, this.title, this.newTiledTexture, rect)
    this.newTiledTexture = new TiledTexture()
    picture.undoStack.push(command)
  }

  private brushSize(waypoint: Waypoint) {
    return this.width * (this.minWidthRatio + (1 - this.minWidthRatio) * waypoint.pressure)
  }
  private brushSpacing(waypoint: Waypoint) {
    return Math.max(this.brushSize(waypoint) * this.spacingRatio, 1)
  }

  private _rectForWaypoints(waypoints: Waypoint[]) {
    const rectWidth = this.width + 2
    const rectSize = new Vec2(rectWidth)
    const rects = waypoints.map(w => {
      const topLeft = new Vec2(w.pos.x - rectWidth * 0.5, w.pos.y - rectWidth * 0.5)
      return new Rect(topLeft, topLeft.add(rectSize))
    })
    return Rect.union(...rects)!.intBounding()
  }

  protected abstract renderWaypoints(waypoints: Waypoint[], rect: Rect): void

  protected prepareTile(key: Vec2) {
    if (!this.targetLayer) {
      return
    }
    if (this.newTiledTexture.has(key)) {
      return this.newTiledTexture.get(key)
    } else if (this.targetLayer.tiledTexture.has(key)) {
      const tile = this.targetLayer.tiledTexture.get(key).clone()
      this.newTiledTexture.set(key, tile)
      return tile
    } else {
      const tile = new Tile()
      this.newTiledTexture.set(key, tile)
      return tile
    }
  }
}

export default BaseBrushTool
