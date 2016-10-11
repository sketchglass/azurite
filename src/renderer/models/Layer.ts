import {Vec2} from "paintvec"
import {Texture} from "paintgl"
import Picture from "./Picture"
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
