import {observable, action} from "mobx"
import {Vec2} from "paintvec"
import {Texture} from "paintgl"
import Picture from "./Picture"
import {context} from "../GLContext"
import TiledTexture, {TiledTextureData} from "./TiledTexture"

export
interface LayerData {
  name: string
  image: TiledTextureData
}

export default
class Layer {
  @observable name = "Layer"
  @observable thumbnail = ""

  constructor(public picture: Picture, public tiledTexture = new TiledTexture()) {
    this.updateThumbnail()
  }

  @action updateThumbnail() {
    this.thumbnail = this.picture.thumbnailGenerator.generate(this)
  }

  toData(): LayerData {
    const {name} = this
    const image = this.tiledTexture.toData()
    return {
      name,
      image,
    }
  }

  static fromData(picture: Picture, data: LayerData) {
    const layer = new Layer(picture, TiledTexture.fromData(data.image))
    layer.name = data.name
    return layer
  }
}
