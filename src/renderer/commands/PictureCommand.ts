import {Vec2, Transform} from "paintvec"
import {UndoCommand} from "../models/UndoStack"
import Picture, {PictureDimension} from "../models/Picture"
import Selection from "../models/Selection"
import Layer from "../models/Layer"
import {TransformLayerCommand} from "./LayerCommand"

function transformPicture(picture: Picture, newSize: Vec2, transform: Transform) {
  picture.forEachLayer(layer => {
    const content = layer.content
    if (content.type != "image") {
      return
    }
    content.tiledTexture = content.tiledTexture.transform(transform)
  })
  picture.selection = picture.selection.transform(newSize, transform)
  const {width, height} = newSize
  const {dpi} = picture.dimension
  picture.dimension = {width, height, dpi}
  picture.lastUpdate = {}
}

export
class FlipPictureCommand {
  title = this.orientation == "horizontal" ? "Flip Canvas Horizontally" : "Flip Canvas Vertically"

  constructor(public picture: Picture, public orientation: "horizontal"|"vertical") {
  }

  flipPicture() {
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
    transformPicture(this.picture, this.picture.size, transform)
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
  title = this.direction == "left" ? "Rotate Canvas 90° Left" : "Rotate Canvas 90° Right"

  constructor(public picture: Picture, public direction: "left"|"right") {
  }

  rotatePicture(direction: "left"|"right") {
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
    transformPicture(this.picture, new Vec2(height, width), transform)
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
    const {width, height} = this.picture.size
    const transform = new Transform(-1, 0, 0, 0, -1, 0, width, height, 1)
    transformPicture(this.picture, this.picture.size, transform)
  }

  undo() {
    this.rotatePicture()
  }
  redo() {
    this.rotatePicture()
  }
}

export
class ChangePictureResolutionCommand {
  title = "Change Canvas Resolution"
  oldDimension: PictureDimension
  transformCommands: UndoCommand[] = []
  oldSelection: Selection

  constructor(public picture: Picture, public newDimension: PictureDimension) {
  }

  undo() {
    for (const command of this.transformCommands) {
      command.undo()
    }
    this.picture.selection = this.oldSelection
    this.picture.dimension = this.oldDimension
    this.picture.lastUpdate = {}
  }

  redo() {
    const oldDimension = this.picture.dimension
    const dimension = this.newDimension
    this.transformCommands = []

    if (oldDimension.width != dimension.width || oldDimension.height != dimension.height) {
      const transform = Transform.scale(new Vec2(dimension.width / oldDimension.width, dimension.height / oldDimension.height))
      this.picture.forEachLayer(layer => {
        const transformCommand = new TransformLayerCommand(this.picture, layer.path(), transform)
        this.transformCommands.push(transformCommand)
        transformCommand.redo()
      })
      this.oldSelection = this.picture.selection
      this.picture.selection = this.oldSelection.transform(new Vec2(dimension.width, dimension.height), transform, {bicubic: true})
    }

    this.oldDimension = oldDimension
    this.picture.dimension = dimension
    this.picture.lastUpdate = {}
  }
}

export
class ChangeCanvasAreaCommand {
  title = "Change Canvas Area"
  oldDimension: PictureDimension

  constructor(public picture: Picture, public dimension: PictureDimension, public offset: Vec2) {
  }

  translateLayer(layer: Layer, offset: Vec2) {
    const content = layer.content
    if (content.type != "image") {
      return
    }
    content.tiledTexture = content.tiledTexture.transform(Transform.translate(offset))
  }

  translatePicture(offset: Vec2) {
    this.picture.forEachLayer(layer => this.translateLayer(layer, offset))
  }

  undo() {
    this.translatePicture(this.offset)
    this.picture.dimension = this.oldDimension
    this.picture.lastUpdate = {}
  }
  redo() {
    this.translatePicture(this.offset.neg())
    this.oldDimension = this.picture.dimension
    this.picture.dimension = this.dimension
    this.picture.lastUpdate = {}
  }
}
