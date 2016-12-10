import * as React from "react"
import {observable} from "mobx"
import {Vec2, Transform, Rect} from "paintvec"
import {Texture, TextureDrawTarget, BlendMode, Color} from "paintgl"
import {context} from "../GLContext"
import {drawTexture, duplicateTexture} from "../GLUtil"
import Tool, {ToolPointerEvent} from './Tool'
import FrameDebounced from "../views/components/FrameDebounced"
import {frameDebounce} from "../../lib/Debounce"
import {SelectionChangeCommand} from "../commands/SelectionCommand"

export default
class RectSelectTool extends Tool {
  name = "Rectangle Select"
  get cursor() {
    return "crosshair"
  }

  selecting = false
  dragging = false
  startRendererPos = new Vec2()
  currentRendererPos = new Vec2()
  startPicturePos = new Vec2()
  currentPicturePos = new Vec2()

  adding = false

  canvas = document.createElement("canvas")
  context = this.canvas.getContext("2d")!
  canvasTexture = new Texture(context, {})
  hasOriginal = false
  originalSelectionTexture = new Texture(context, {})
  originalSelectionDrawTarget = new TextureDrawTarget(context, this.originalSelectionTexture)

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }

    const {selection} = this.picture
    this.resetData()

    this.startRendererPos = this.currentRendererPos = ev.rendererPos.round()
    this.startPicturePos = this.currentPicturePos = ev.picturePos.round()

    if (selection.includes(ev.picturePos)) {
      // move
      this.dragging = true
    } else {
      // select
      this.adding = ev.shiftKey
      this.selecting = true

      if (!this.adding) {
        selection.clear()
        this.renderer.wholeDirty = true
        this.renderer.update()
      }
    }
  }

  move(ev: ToolPointerEvent) {
    if (!this.picture || !(this.selecting || this.dragging)) {
      return
    }
    this.currentRendererPos = ev.rendererPos.round()
    this.currentPicturePos = ev.picturePos.round()
    this.updateSelection()
  }

  resetData() {
    if (!this.picture) {
      return
    }
    const {selection} = this.picture
    if (!new Vec2(this.canvas.width, this.canvas.height).equals(selection.size)) {
      this.canvas.width = selection.size.width
      this.canvas.height = selection.size.height
    }
    if (!this.originalSelectionTexture.size.equals(selection.size)) {
      this.originalSelectionTexture.size = selection.size
    }
    this.hasOriginal = selection.hasSelection

    drawTexture(this.originalSelectionDrawTarget, selection.texture, {blendMode: "src"})
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  updateSelectionNow() {
    if (!this.picture) {
      return
    }
    const {selection} = this.picture

    if (this.selecting && !this.startRendererPos.equals(this.currentRendererPos)) {
      const rect = Rect.fromTwoPoints(this.startRendererPos, this.currentRendererPos)

      this.context.setTransform(1, 0, 0, 1, 0, 0)
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

      const transform = this.renderer.transformToPicture
      this.context.setTransform(transform.m00, transform.m01, transform.m10, transform.m11, transform.m20, transform.m21)
      this.context.fillStyle = "white"
      this.context.fillRect(rect.left, rect.top, rect.width, rect.height)

      this.canvasTexture.setImage(this.canvas)

      if (this.adding) {
        drawTexture(selection.drawTarget, this.originalSelectionTexture, {blendMode: "src"})
        drawTexture(selection.drawTarget, this.canvasTexture, {blendMode: "src-over"})
      } else {
        drawTexture(selection.drawTarget, this.canvasTexture, {blendMode: "src"})
      }
    }
    if (this.dragging) {
      const offset = this.currentPicturePos.sub(this.startPicturePos)
      selection.clear()
      drawTexture(selection.drawTarget, this.originalSelectionTexture, {blendMode: "src", transform: Transform.translate(offset)})
    }

    selection.hasSelection = true
    this.renderer.wholeDirty = true
    this.renderer.renderNow()
  }

  updateSelection = frameDebounce(() => this.updateSelectionNow())

  commit() {
    if (!this.picture) {
      return
    }
    const {selection} = this.picture
    const oldTexture = this.hasOriginal ? duplicateTexture(this.originalSelectionTexture) : undefined
    const newTexture = selection.hasSelection ? duplicateTexture(this.canvasTexture) : undefined
    const command = new SelectionChangeCommand(this.picture, oldTexture, newTexture)
    this.picture.undoStack.push(command)
  }

  end(ev: ToolPointerEvent) {
    if (!this.picture || !(this.selecting || this.dragging)) {
      return
    }
    this.updateSelectionNow()
    this.commit()
    this.dragging = false
    this.selecting = false
  }
}
