import {Vec2, Rect, Transform} from "paintvec"
import {Texture, TextureDrawTarget, Color} from "paintgl"
import Waypoint from "./Waypoint"
import Tool from "./Tool"
import Layer from "./Layer"
import TiledTexture from "./TiledTexture"
import {context} from "../GLContext"
import {copyTexture, copyNewTexture, readTextureFloat} from "../GLUtil"
import {float32ArrayTo16} from "../../lib/Float"

abstract class BaseBrushTool extends Tool {
  private lastWaypoints: Waypoint[] = []
  private nextDabOffset = 0

  cursor = "crosshair"

  // brush width (diameter)
  width = 10
  // brush color RGBA
  color = new Color(0, 0, 0, 1)
  // brush opacity
  opacity = 1
  // distance used to soften edge, compared to brush radius
  softness = 0.5
  // width drawn in pressure 0, compared to brush width
  minWidthRatio = 0.5
  // spacing between dabs, compared to brush width
  spacingRatio = 0.1

  oldTiledTexture: TiledTexture|undefined
  originalTexture = new Texture(context, {size: new Vec2(0), pixelType: "half-float"})
  editedRect: Rect|undefined

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

    this.lastWaypoints = [waypoint]
    this.nextDabOffset = this.brushSpacing(waypoint)
    const rect = this._rectForWaypoints([waypoint])
    this.renderWaypoints([waypoint], rect)
    this.addEditedRect(rect)
    this.renderRect(rect)
  }

  move(waypoint: Waypoint) {
    const {lastWaypoints} = this
    if (lastWaypoints.length == 4) {
      lastWaypoints.shift()
    }
    lastWaypoints.push(waypoint)

    if (lastWaypoints.length <= 2) {
      return
    }
    const getSpacing = this.brushSpacing.bind(this)
    const {waypoints, nextOffset} = (() => {
      if (lastWaypoints.length == 3) {
        return Waypoint.subdivideCurve(lastWaypoints[0], lastWaypoints[0], lastWaypoints[1], lastWaypoints[2], getSpacing, this.nextDabOffset)
      } else {
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

  end() {
    const drawLast = () => {
      const getSpacing = this.brushSpacing.bind(this)
      const {lastWaypoints} = this
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
    const rect = drawLast()
    this.pushUndoStack()
    this.picture.currentLayer.updateThumbnail()
    this.picture.changed.next()
    return rect
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
    return Rect.union(...rects).intBounding()
  }

  abstract renderWaypoints(waypoints: Waypoint[], rect: Rect): void
}

class BrushUndoCommand {
  constructor(public layer: Layer, public rect: Rect, public oldData: Uint16Array, public newData: Uint16Array) {
  }

  replace(data: Uint16Array) {
    const texture = new Texture(context, {
      size: this.rect.size,
      pixelType: "half-float",
      data
    })
    this.layer.tiledTexture.writeTexture(texture, this.rect.topLeft)
    texture.dispose()
    this.layer.updateThumbnail()
    this.layer.picture.changed.next()
  }

  undo() {
    this.replace(this.oldData)
  }
  redo() {
    this.replace(this.newData)
  }
}

export default BaseBrushTool
