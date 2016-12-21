import {reaction} from "mobx"
import Tool, {ToolPointerEvent} from './Tool'
import FloodFill from "../services/FloodFill"
import {SelectionChangeCommand} from "../commands/SelectionCommand"

export default
class FloodFillTool extends Tool {
  name = "Flood Fill"
  private floodFill: FloodFill|undefined

  constructor() {
    super()
    reaction(() => [this.picture, this.picture && this.picture.size], () => {
      this.renewFloodFill()
    })
  }

  start(ev: ToolPointerEvent) {
  }

  move(ev: ToolPointerEvent) {
  }

  end(ev: ToolPointerEvent) {
    if (this.picture && this.picture.rect.includes(ev.picturePos)) {
      if (this.floodFill) {
        const selection = this.picture.selection.clone()
        this.floodFill.floodFill(ev.picturePos.floor(), selection)
        const command = new SelectionChangeCommand(this.picture, selection)
        this.picture.undoStack.redoAndPush(command)
      }
    }
  }

  private renewFloodFill() {
    if (this.floodFill) {
      this.floodFill.dispose()
      this.floodFill = undefined
    }
    if (this.picture) {
      this.floodFill = new FloodFill(this.picture)
    }
  }
}
