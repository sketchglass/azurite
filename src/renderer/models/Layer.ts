import {Vec2, Transform} from "../../lib/Geometry"
import Picture from "./Picture"
import {Texture, DataType} from "../../lib/GL"
import {context} from "../GLContext"
import TiledTexture from "./TiledTexture"

export default
class Layer {
  name = "Layer"
  tiledTexture = new TiledTexture()
  thumbnail = ""

  constructor(public picture: Picture, public size: Vec2) {
    this.updateThumbnail()
  }

  updateThumbnail() {
    this.thumbnail = this.picture.thumbnailGenerator.generate(this)
  }
}
