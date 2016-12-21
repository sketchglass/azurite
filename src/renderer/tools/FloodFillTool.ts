import {reaction} from "mobx"
import Tool, {ToolPointerEvent} from './Tool'
import FloodFill from "../services/FloodFill"
import {SelectionChangeCommand} from "../commands/SelectionCommand"

export default
class FloodFillTool extends Tool {
  name = "Flood Fill"
  private floodFillDirty = true
  private floodFill: FloodFill|undefined

  constructor() {
    super()
    reaction(() => [this.picture, this.picture && this.picture.size, this.picture && this.picture.lastUpdate], () => {
      this.floodFillDirty = true
    })
  }

  start(ev: ToolPointerEvent) {
  }

  move(ev: ToolPointerEvent) {
  }

  end(ev: ToolPointerEvent) {
    if (this.picture && this.picture.rect.includes(ev.picturePos)) {
      this.renewFloodFill()
      if (this.floodFill) {
        this.floodFill.floodFill(ev.picturePos.floor())
        const command = new SelectionChangeCommand(this.picture, this.floodFill.selection.clone())
        this.picture.undoStack.redoAndPush(command)
      }
    }
  }

  private renewFloodFill() {
    if (!this.floodFillDirty) {
      return
    }
    if (this.floodFill) {
      this.floodFill.dispose()
      this.floodFill = undefined
    }
    if (this.picture) {
      this.floodFill = new FloodFill(this.picture)
    }
    this.floodFillDirty = false
  }
}
