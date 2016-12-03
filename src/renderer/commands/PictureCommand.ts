import {Rect, Vec2} from "paintvec"
import {UndoCommand, CompositeUndoCommand} from "../models/UndoStack"
import Picture from "../models/Picture"
import {FlipLayerCommand} from "./LayerCommand"

export
class FlipPictureCommand extends CompositeUndoCommand {
  title: string
  commands: UndoCommand[]

  constructor(public picture: Picture, public orientation: "horizontal"|"vertical") {
    super()
    if (orientation == "horizontal") {
      this.title = "Flip Picture Horizontally"
    } else {
      this.title = "Flip Picture Vertically"
    }
    this.commands = []
    const center = picture.size.divScalar(2)
    picture.forEachLayer(layer => {
      this.commands.push(new FlipLayerCommand(picture, layer.path(), center, orientation))
    })
  }
}
