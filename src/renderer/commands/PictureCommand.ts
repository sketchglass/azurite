import {Rect, Vec2, Transform} from "paintvec"
import {UndoCommand} from "../models/UndoStack"
import Picture from "../models/Picture"
import Layer from "../models/Layer"

export
class FlipPictureCommand {
  title = this.orientation == "horizontal" ? "Flip Canvas Horizontally" : "Flip Canvas Vertically"

  constructor(public picture: Picture, public orientation: "horizontal"|"vertical") {
  }

  flipLayer(layer: Layer) {
    const content = layer.content
    if (content.type != "image") {
      return
    }
    const center = this.picture.size.divScalar(2)
    let transform: Transform
    if (this.orientation == "horizontal") {
      transform = Transform.translate(center.neg()).scale(new Vec2(-1, 1)).translate(center)
    } else {
      transform = Transform.translate(center.neg()).scale(new Vec2(1, -1)).translate(center)
    }
    content.tiledTexture = content.tiledTexture.transform(transform)
  }

  flipPicture() {
    this.picture.forEachLayer(layer => this.flipLayer(layer))
    this.picture.lastUpdate = {}
  }

  undo() {
    this.flipPicture()
  }
  redo() {
    this.flipPicture()
  }
}
