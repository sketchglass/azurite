import {observable, action, autorun} from "mobx"
import {Vec2, Rect, Transform} from "paintvec"
import {Texture, TextureDrawTarget, Color} from "paintgl"
import Waypoint from "./Waypoint"
import Tool from "./Tool"
import Layer from "./Layer"
import TiledTexture from "./TiledTexture"
import {context} from "../GLContext"
import {copyTexture, copyNewTexture, readTextureFloat} from "../GLUtil"
import {float32ArrayTo16} from "../../lib/Float"

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

  cursor = "crosshair"

  // brush width (diameter)
  @observable width = 10
  // brush color RGBA
  color = new Color(0, 0, 0, 1)
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

  oldTiledTexture: TiledTexture|undefined
  originalTexture = new Texture(context, {size: new Vec2(0), pixelType: "half-float"})
  editedRect: Rect|undefined

  cursorElement = document.createElement("canvas")
  cursorContext = this.cursorElement.getContext("2d")!

  constructor() {
    super()
    autorun(() => this.updateCursor())
  }

  updateCursor() {
    const radius = this.width / 2
    const dpr = window.devicePixelRatio
    const canvasSize = this.width + 4 * dpr
    const center = canvasSize / 2
    this.cursorElement.width = canvasSize
    this.cursorElement.height = canvasSize
    this.cursorElement.style.width = `${canvasSize/dpr}px`
    this.cursorElement.style.height = `${canvasSize/dpr}px`

    const context = this.cursorContext

    context.lineWidth = window.devicePixelRatio
    context.strokeStyle = "rgba(0,0,0,0.5)"

    context.beginPath()
    context.ellipse(center, center, radius, radius, 0, 0, 2 * Math.PI)
    context.stroke()

    context.strokeStyle = "rgba(255,255,255,0.5)"
    context.beginPath()
    context.ellipse(center, center, radius + dpr, radius + dpr, 0, 0, 2 * Math.PI)
    context.stroke()

    this.cursorElementSize = canvasSize / dpr
  }

  addEditedRect(rect: Rect) {
    if (this.editedRect) {
      this.editedRect = this.editedRect.union(rect)
    } else {
      this.editedRect = rect
    }
  }

  renderRect(rect: Rect) {
    this.picture.layerBlender.render(rect)
    this.renderer.render(rect)
  }

  start(waypoint: Waypoint) {
    const {tiledTexture} = this.picture.currentLayer
    if (this.oldTiledTexture) {
      this.oldTiledTexture.dispose()
    }
    this.oldTiledTexture = tiledTexture.clone()

    this.lastStabilizeWaypoints = []
    this.lastInterpolateWaypoints = []

    this.stabilizeMove(waypoint)
  }

  move(waypoint: Waypoint) {
    this.stabilizeMove(waypoint)
  }

  @action end() {
    this.stabilizeEnd()
    this.pushUndoStack()
    this.picture.currentLayer.updateThumbnail()
  }

  stabilizeMove(waypoint: Waypoint) {
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

  stabilizeEnd() {
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

  interpolateMove(waypoint: Waypoint) {
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

  interpolateEnd() {
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
    const {tiledTexture} = this.picture.currentLayer
    // can't read directly from half float texture so read it to float texture first
    const oldTexture = new Texture(context, {size: rect.size, pixelType: "float"})
    const newTexture = new Texture(context, {size: rect.size, pixelType: "float"})
    this.oldTiledTexture!.readToTexture(oldTexture, rect.topLeft)
    tiledTexture.readToTexture(newTexture, rect.topLeft)
    const oldData = float32ArrayTo16(readTextureFloat(oldTexture))
    const newData = float32ArrayTo16(readTextureFloat(newTexture))
    oldTexture.dispose()
    newTexture.dispose()
    const undoCommand = new BrushUndoCommand(this.picture.currentLayer, rect, oldData, newData)
    this.picture.undoStack.push(undoCommand)
  }

  brushSize(waypoint: Waypoint) {
    return this.width * (this.minWidthRatio + (1 - this.minWidthRatio) * waypoint.pressure)
  }
  brushSpacing(waypoint: Waypoint) {
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

  abstract renderWaypoints(waypoints: Waypoint[], rect: Rect): void
}

class BrushUndoCommand {
  constructor(public layer: Layer, public rect: Rect, public oldData: Uint16Array, public newData: Uint16Array) {
  }

  @action replace(data: Uint16Array) {
    const texture = new Texture(context, {
      size: this.rect.size,
      pixelType: "half-float",
      data
    })
    this.layer.tiledTexture.writeTexture(texture, this.rect.topLeft)
    texture.dispose()
    this.layer.picture.updated.next(this.rect)
    this.layer.updateThumbnail()
  }

  undo() {
    this.replace(this.oldData)
  }
  redo() {
    this.replace(this.newData)
  }
}

export default BaseBrushTool
