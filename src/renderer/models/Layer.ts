import {observable, action} from "mobx"
import {Vec2} from "paintvec"
import {Texture} from "paintgl"
import Picture from "./Picture"
import {context} from "../GLContext"
import TiledTexture from "./TiledTexture"

export default
class Layer {
  @observable name = "Layer"
  tiledTexture = new TiledTexture()
  @observable thumbnail = ""

  constructor(public picture: Picture, public size: Vec2) {
    this.updateThumbnail()
  }

  @action updateThumbnail() {
    this.thumbnail = this.picture.thumbnailGenerator.generate(this)
  }
}
