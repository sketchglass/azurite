import {Rect, Vec2} from "paintvec"
import {UndoCommand, CompositeUndoCommand} from "../models/UndoStack"
import Picture from "../models/Picture"
import {FlipLayerCommand} from "./LayerCommand"

export
class FlipPictureCommand extends CompositeUndoCommand {
  title = this.orientation == "horizontal" ? "Flip Canvas Horizontally" : "Flip Canvas Vertically"
  subcommands: UndoCommand[] = []

  constructor(public picture: Picture, public orientation: "horizontal"|"vertical") {
    super()
    picture.forEachLayer(layer => {
      this.subcommands.push(new FlipLayerCommand(picture, layer.path(), orientation))
    })
  }
}
