import {Texture, Color} from "paintgl"
import {UndoCommand} from "../models/UndoStack"
import Picture from "../models/Picture"
import {drawTexture, duplicateTexture} from "../GLUtil"

abstract class SelectionCommand implements UndoCommand {
  abstract title: string
  oldTexture: Texture|undefined

  get selection() {
    return this.picture.selection
  }

  constructor(public picture: Picture) {
  }

  setTexture(texture: Texture|undefined) {
    const {selection} = this
    if (texture) {
      drawTexture(selection.drawTarget, texture, {blendMode: "src"})
      selection.hasSelection = true
    } else {
      selection.clear()
    }
  }

  undo() {
    this.setTexture(this.oldTexture)
    if (this.oldTexture) {
      this.oldTexture.dispose()
      this.oldTexture = undefined
    }
    this.picture.lastUpdate = {}
  }

  abstract apply(): void

  redo() {
    const {selection} = this
    this.oldTexture = selection.hasSelection ? duplicateTexture(selection.texture) : undefined
    this.apply()
    this.picture.lastUpdate = {}
  }
}

export
class SelectionChangeCommand implements UndoCommand {
  title = "Change Selection"

  constructor(public picture: Picture, public oldTexture: Texture|undefined, public newTexture: Texture|undefined) {
  }

  setTexture(texture: Texture|undefined) {
    const {selection} = this.picture
    if (texture) {
      drawTexture(selection.drawTarget, texture, {blendMode: "src"})
      selection.hasSelection = true
    } else {
      selection.clear()
    }
    this.picture.lastUpdate = {}
  }

  undo() {
    this.setTexture(this.oldTexture)
  }

  redo() {
    this.setTexture(this.newTexture)
  }
}

export
class SelectAllCommand extends SelectionCommand {
  title = "Select All"

  apply() {
    const {selection} = this
    selection.drawTarget.clear(new Color(1, 1, 1, 1))
    selection.hasSelection = true
  }
}


export
class ClearSelectionCommand extends SelectionCommand {
  title = "Clear Selection"

  apply() {
    const {selection} = this
    selection.clear()
  }
}

export
class InvertSelectionCommand extends SelectionCommand {
  title = "Invert Selection"

  apply() {
    const {selection} = this
    selection.drawTarget.clear(new Color(1, 1, 1, 1))
    if (this.oldTexture) {
      drawTexture(selection.drawTarget, this.oldTexture, {blendMode: "dst-out"})
    }
    selection.hasSelection = true
  }
}
