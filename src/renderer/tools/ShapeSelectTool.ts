import {Vec2, Transform} from "paintvec"
import {Texture, TextureDrawTarget, Color} from "paintgl"
import {context} from "../GLContext"
import {drawTexture, duplicateTexture} from "../GLUtil"
import Tool, {ToolPointerEvent} from './Tool'
import {frameDebounce} from "../../lib/Debounce"
import {SelectionChangeCommand} from "../commands/SelectionCommand"

abstract class ShapeSelectTool extends Tool {
  drawing = false
  moving = false
  adding = false
  startPicturePos = new Vec2()
  currentPicturePos = new Vec2()

  private canvas = document.createElement("canvas")
  private context = this.canvas.getContext("2d")!
  private canvasTexture = new Texture(context, {})
  private hasOriginal = false
  private originalSelectionTexture = new Texture(context, {})
  private originalSelectionDrawTarget = new TextureDrawTarget(context, this.originalSelectionTexture)

  start(ev: ToolPointerEvent) {
    if (!this.picture) {
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
    if (!this.originalSelectionTexture.size.equals(selection.size)) {
      this.originalSelectionTexture.size = selection.size
    }
    this.hasOriginal = selection.hasSelection

    drawTexture(this.originalSelectionDrawTarget, selection.texture, {blendMode: "src"})
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private moveSelection() {
    if (!this.picture || !this.moving) {
      return
    }
    const {selection} = this.picture
    const offset = this.currentPicturePos.sub(this.startPicturePos)
    selection.drawTarget.clear(new Color(0, 0, 0, 0))
    drawTexture(selection.drawTarget, this.originalSelectionTexture, {blendMode: "src", transform: Transform.translate(offset)})
  }

  private drawSelection() {
    if (!this.picture || !this.drawing) {
      return
    }
    const {selection} = this.picture

    this.context.setTransform(1, 0, 0, 1, 0, 0)
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const transform = this.renderer.transformToPicture
    this.context.setTransform(transform.m00, transform.m01, transform.m10, transform.m11, transform.m20, transform.m21)
    this.context.fillStyle = "white"
    this.context.beginPath()
    this.drawShape(this.context)
    this.context.fill()

    this.canvasTexture.setImage(this.canvas)

    if (this.adding) {
      drawTexture(selection.drawTarget, this.originalSelectionTexture, {blendMode: "src"})
      drawTexture(selection.drawTarget, this.canvasTexture, {blendMode: "src-over"})
    } else {
      drawTexture(selection.drawTarget, this.canvasTexture, {blendMode: "src"})
    }
    selection.hasSelection = true
  }

  private update = frameDebounce(() => {
    if (this.moving) {
      this.moveSelection()
    }
    this.renderer.wholeDirty = true
    this.renderer.renderNow()
  })

  private commit() {
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
    if (!this.picture || !(this.drawing || this.moving)) {
      return
    }
    if (this.drawing) {
      this.drawSelection()
    }
    if (this.moving) {
      this.moveSelection()
    }
    this.commit()
    this.moving = false
    this.drawing = false
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
}
export default ShapeSelectTool
