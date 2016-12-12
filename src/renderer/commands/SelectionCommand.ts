import {Texture} from "paintgl"
import {UndoCommand} from "../models/UndoStack"
import Picture from "../models/Picture"
import {drawTexture, duplicateTexture} from "../GLUtil"

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
class SelectAllCommand implements UndoCommand {
  title = "Select All"
  oldTexture: Texture|undefined

  constructor(public picture: Picture) {
  }

  undo() {
    const {selection} = this.picture
    if (this.oldTexture) {
      drawTexture(selection.drawTarget, this.oldTexture, {blendMode: "src"})
      selection.hasSelection = true
    } else {
      selection.clear()
    }
  }

  redo() {
    const {selection} = this.picture
    this.oldTexture = selection.hasSelection ? duplicateTexture(selection.texture) : undefined
    selection.selectAll()
  }
}
