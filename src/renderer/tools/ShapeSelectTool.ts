import {Vec2, Transform} from "paintvec"
import {Texture, Color} from "paintgl"
import Selection from "../models/Selection"
import {context} from "../GLContext"
import {drawTexture} from "../GLUtil"
import Tool, {ToolPointerEvent} from './Tool'
import {frameDebounce} from "../../lib/Debounce"
import {SelectionChangeCommand} from "../commands/SelectionCommand"

abstract class ShapeSelectTool extends Tool {
  commitDrawOnEnd = true

  drawing = false
  moving = false
  adding = false
  startPicturePos = new Vec2()
  currentPicturePos = new Vec2()

  private canvas = document.createElement("canvas")
  private context = this.canvas.getContext("2d")!
  private canvasTexture = new Texture(context, {})
  private workingSelection: Selection|undefined

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    if (this.drawing) {
      this.update()
      return
    }

    const {selection} = this.picture
    this.resetData()

    this.startPicturePos = this.currentPicturePos = ev.picturePos.round()

    this.adding = ev.shiftKey
    if (selection.includes(ev.picturePos) && !this.adding) {
      // move
      this.moving = true
    } else {
      // draw
      this.drawing = true

      if (!this.adding) {
        selection.clear()
        this.renderer.wholeDirty = true
        this.renderer.update()
      }
    }
    this.update()
  }

  move(ev: ToolPointerEvent) {
    if (!this.picture || !(this.drawing || this.moving)) {
      return
    }
    this.currentPicturePos = ev.picturePos.round()
    this.update()
  }

  private resetData() {
    if (!this.picture) {
      return
    }
    const {selection} = this.picture
    if (!new Vec2(this.canvas.width, this.canvas.height).equals(selection.size)) {
      this.canvas.width = selection.size.width
      this.canvas.height = selection.size.height
    }
    this.workingSelection = selection.clone()
    this.workingSelection.hasSelection = true
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private moveSelection() {
    if (!this.picture || !this.moving || !this.workingSelection) {
      return
    }
    const selection = this.workingSelection
    const offset = this.currentPicturePos.sub(this.startPicturePos)
    selection.drawTarget.clear(new Color(0, 0, 0, 0))
    drawTexture(selection.drawTarget, this.picture.selection.texture, {blendMode: "src", transform: Transform.translate(offset)})
  }

  private drawSelection() {
    if (!this.picture || !this.drawing || !this.workingSelection) {
      return
    }
    const selection = this.workingSelection
    const {context} = this

    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const transform = this.renderer.transformToPicture
    context.setTransform(transform.m00, transform.m01, transform.m10, transform.m11, transform.m20, transform.m21)
    context.fillStyle = "white"
    context.beginPath()
    this.drawShape(context)
    context.closePath()
    context.fill()

    this.canvasTexture.setImage(this.canvas)

    if (this.adding) {
      drawTexture(selection.drawTarget, this.picture.selection.texture, {blendMode: "src"})
      drawTexture(selection.drawTarget, this.canvasTexture, {blendMode: "src-over"})
    } else {
      drawTexture(selection.drawTarget, this.canvasTexture, {blendMode: "src"})
    }
    selection.hasSelection = true
  }

  update = frameDebounce(() => {
    if (this.moving) {
      this.moveSelection()
    }
    this.renderer.wholeDirty = true
    this.renderer.renderNow()
  })

  commit() {
    if (!this.picture || !this.workingSelection) {
      return
    }
    if (this.drawing) {
      this.drawSelection()
    }
    if (this.moving) {
      this.moveSelection()
    }
    const command = new SelectionChangeCommand(this.picture, this.workingSelection)
    this.picture.undoStack.redoAndPush(command)
    this.workingSelection = undefined

    this.moving = false
    this.drawing = false
  }

  end(ev: ToolPointerEvent) {
    if (!this.picture) {
      return
    }
    if (this.drawing && this.commitDrawOnEnd) {
      this.commit()
    }
    if (this.moving) {
      this.commit()
    }
  }

  renderOverlayCanvas(context: CanvasRenderingContext2D) {
    if (this.drawing) {
      context.strokeStyle = "#888"
      context.lineWidth = 1
      context.beginPath()
      this.drawShape(context)
      context.stroke()
    }
  }

  abstract drawShape(context: CanvasRenderingContext2D): void

  previewSelection() {
    if (this.workingSelection) {
      return this.workingSelection
    } else {
      return false
    }
  }
}
export default ShapeSelectTool
