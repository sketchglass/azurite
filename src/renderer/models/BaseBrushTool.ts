import {Vec2, Vec4, Transform, unionRect} from "../../lib/Geometry"
import Waypoint from "./Waypoint"
import Tool from "./Tool"
import Layer from "./Layer"
import {Framebuffer, Texture, DataType} from "../../lib/GL"
import {context} from "../GLContext"
import {copyTexture, copyNewTexture, readTextureFloat} from "../GLUtil"
import {float32ArrayTo16} from "../../lib/Float"

abstract class BaseBrushTool extends Tool {
  private lastWaypoints: Waypoint[] = []
  private nextDabOffset = 0
  width = 10
  color = new Vec4(0, 0, 0, 1)
  opacity = 1
  minWidthRatio = 0.5
  spacingRatio = 0.1
  framebuffer = new Framebuffer(context)
  originalTexture = new Texture(context, new Vec2(0), DataType.HalfFloat)
  editedRect = new Vec4(0)

  start(waypoint: Waypoint) {
    const {texture} = this.picture.currentLayer
    this.framebuffer.setTexture(texture)
    this.originalTexture.reallocate(texture.size)
    copyTexture(texture, this.originalTexture, new Vec2(0))

    this.lastWaypoints = [waypoint]
    this.nextDabOffset = this.brushSpacing(waypoint)
    this.renderWaypoints([waypoint])

    const rect = this._rectForWaypoints([waypoint])
    this.editedRect = rect
    return rect
  }

  move(waypoint: Waypoint) {
    const {lastWaypoints} = this
    if (lastWaypoints.length == 4) {
      lastWaypoints.shift()
    }
    lastWaypoints.push(waypoint)

    if (lastWaypoints.length <= 2) {
      return new Vec4(0)
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
      return new Vec4(0)
    } else {
      this.renderWaypoints(waypoints)
      const rect = this._rectForWaypoints(waypoints)
      this.editedRect = unionRect(this.editedRect, rect)
      return rect
    }
  }

  end() {
    const getSpacing = this.brushSpacing.bind(this)
    const {lastWaypoints} = this
    if (lastWaypoints.length < 2) {
      return new Vec4(0)
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

    if (waypoints.length == 0) {
      return new Vec4(0)
    } else {
      this.renderWaypoints(waypoints)
      this.picture.currentLayer.updateThumbnail()
      this.picture.changed.next()
      const rect = this._rectForWaypoints(waypoints)
      const editedRect = unionRect(this.editedRect, rect)
      this.pushUndoStack(editedRect)
      return rect
    }
  }

  private pushUndoStack(rect: Vec4) {
    const {texture} = this.picture.currentLayer
    // can't read directly from half float texture so read it to float texture first
    const oldTexture = copyNewTexture(this.originalTexture, rect, DataType.Float)
    const newTexture = copyNewTexture(texture, rect, DataType.Float)
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
    return this.brushSize(waypoint) * this.spacingRatio
  }

  private _rectForWaypoints(waypoints: Waypoint[]) {
    const rectWidth = this.width + 2
    const rects = waypoints.map(w => new Vec4(w.pos.x - rectWidth * 0.5, w.pos.y - rectWidth * 0.5, rectWidth, rectWidth))
    return unionRect(...rects)
  }

  abstract renderWaypoints(waypoints: Waypoint[]): void
}

class BrushUndoCommand {
  constructor(public layer: Layer, public rect: Vec4, public oldData: Uint16Array, public newData: Uint16Array) {
  }

  replace(data: Uint16Array) {
    const texture = new Texture(context, this.rect.size, DataType.HalfFloat, data)
    copyTexture(texture, this.layer.texture, this.rect.xy.neg())
  }

  undo() {
    this.replace(this.oldData)
  }
  redo() {
    this.replace(this.newData)
  }
}

export default BaseBrushTool
