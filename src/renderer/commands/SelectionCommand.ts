import {Texture} from "paintgl"
import {UndoCommand} from "../models/UndoStack"
import Picture from "../models/Picture"
import Selection from "../models/Selection"
import {drawTexture} from "../GLUtil"

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
