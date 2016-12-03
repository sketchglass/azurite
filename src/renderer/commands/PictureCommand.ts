import {Rect, Vec2} from "paintvec"
import {UndoCommand, CompositeUndoCommand} from "../models/UndoStack"
import Picture from "../models/Picture"
import {FlipLayerCommand} from "./LayerCommand"

export
class FlipPictureCommand extends CompositeUndoCommand {
  title: string
  subcommands: UndoCommand[]

  constructor(public picture: Picture, public orientation: "horizontal"|"vertical") {
    super()
    if (orientation == "horizontal") {
      this.title = "Flip Canvas Horizontally"
    } else {
      this.title = "Flip Canvas Vertically"
    }
    this.subcommands = []
    const center = picture.size.divScalar(2)
    picture.forEachLayer(layer => {
      this.subcommands.push(new FlipLayerCommand(picture, layer.path(), center, orientation))
    })
  }
}
