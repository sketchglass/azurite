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
    const {width, height} = this.picture.size
    let transform: Transform
    if (this.orientation == "horizontal") {
      // x' = width - x
      // y' = y
      transform = new Transform(-1, 0, 0, 0, 1, 0, width, 0, 1)
    } else {
      // x' = x
      // y' = height - y
      transform = new Transform(1, 0, 0, 0, -1, 0, 0, height, 1)
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

export
class Rotate90PictureCommand {
  title = this.direction == "left" ? "Rotate Canvas 90° Left": "Rotate Canvas 90° Right"

  constructor(public picture: Picture, public direction: "left"|"right") {
  }

  rotateLayer(layer: Layer, direction: "left"|"right") {
    const content = layer.content
    if (content.type != "image") {
      return
    }
    const {width, height} = this.picture.size
    let transform: Transform
    if (direction == "left") {
      // x' = y
      // y' = width - x
      transform = new Transform(0, -1, 0, 1, 0, 0, 0, width, 1)
    } else {
      // x' = height - y
      // y' = x
      transform = new Transform(0, 1, 0, -1, 0, 0, height, 0, 1)
    }
    content.tiledTexture = content.tiledTexture.transform(transform)
  }

  rotatePicture(direction: "left"|"right") {
    this.picture.forEachLayer(layer => this.rotateLayer(layer, direction))
    const {width, height, dpi} = this.picture.dimension
    this.picture.dimension = {width: height, height: width, dpi}
    this.picture.lastUpdate = {}
  }

  undo() {
    this.rotatePicture(this.direction == "left" ? "right" : "left")
  }
  redo() {
    this.rotatePicture(this.direction)
  }
}

export
class Rotate180PictureCommand {
  title = "Rotate Canvas 180°"

  constructor(public picture: Picture) {
  }

  rotateLayer(layer: Layer) {
    const content = layer.content
    if (content.type != "image") {
      return
    }
    const {width, height} = this.picture.size
    const transform = new Transform(-1, 0, 0, 0, -1, 0, width, height, 1)
    content.tiledTexture = content.tiledTexture.transform(transform)
  }

  rotatePicture() {
    this.picture.forEachLayer(layer => this.rotateLayer(layer))
    this.picture.lastUpdate = {}
  }

  undo() {
    this.rotatePicture()
  }
  redo() {
    this.rotatePicture()
  }
}
