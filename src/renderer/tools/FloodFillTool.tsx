import {reaction, observable} from 'mobx'
import * as React from 'react'
import {SelectionChangeCommand} from '../commands/SelectionCommand'
import FloodFill from '../services/FloodFill'
import FloodFillSettings from '../views/FloodFillSettings'
import Tool, {ToolPointerEvent} from './Tool'
import ToolIDs from './ToolIDs'

export default
class FloodFillTool extends Tool {
  readonly id = ToolIDs.floodFill
  readonly title = 'Flood Fill'
  @observable tolerance = 0 // 0 ... 255
  private floodFill: FloodFill|undefined

  constructor() {
    super()
    reaction(() => [this.picture, this.picture && this.picture.size], () => {
      this.renewFloodFill()
    })
  }

  renderSettings() {
    return <FloodFillSettings tool={this} />
  }

  start(ev: ToolPointerEvent) {
  }

  move(ev: ToolPointerEvent) {
  }

  end(ev: ToolPointerEvent) {
    if (this.picture && this.picture.rect.includes(ev.picturePos)) {
      if (this.floodFill) {
        this.floodFill.tolerance = Math.max(0.5, this.tolerance) / 255 // allow small tolerance for antialiasing
        const selection = this.picture.selection.clone()
        this.floodFill.floodFill(ev.picturePos.floor(), selection)
        const command = new SelectionChangeCommand(this.picture, selection)
        this.picture.undoStack.push(command)
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
