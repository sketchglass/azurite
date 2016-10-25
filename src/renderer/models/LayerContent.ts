import {observable, action, IObservableArray} from "mobx"
import Picture from "./Picture"
import Layer, {LayerData} from "./Layer"
import TiledTexture, {TiledTextureData} from "./TiledTexture"

export
interface ImageLayerContentData {
  type: "image"
  image: TiledTextureData
}

export
class ImageLayerContent {
  type: "image" = "image"

  @observable thumbnail = ""

  constructor(public picture: Picture, public tiledTexture: TiledTexture = new TiledTexture()) {
    this.updateThumbnail()
  }

  toData(): ImageLayerContentData {
    const image = this.tiledTexture.toData()
    return {
      type: "image",
      image,
    }
  }

  dispose() {
    this.tiledTexture.dispose()
  }

  static fromData(picture: Picture, data: ImageLayerContentData) {
    const tiledTexture = TiledTexture.fromData(data.image)
    return new ImageLayerContent(picture, tiledTexture)
  }

  @action updateThumbnail() {
    this.thumbnail = this.picture.thumbnailGenerator.generate(this.tiledTexture)
  }
}

export
interface GroupLayerContentData {
  type: "group"
  children: LayerData[]
}

export
class GroupLayerContent {
  type: "group" = "group"

  children: IObservableArray<Layer>

  constructor(children: Layer[]) {
    this.children = observable(children)
  }

  toData(): GroupLayerContentData {
    const children = this.children.map(c => c.toData())
    return {
      type: "group",
      children,
    }
  }

  dispose() {
    for (let c of this.children) {
      c.dispose()
    }
  }

  static fromData(picture: Picture, data: GroupLayerContentData) {
    const children = data.children.map(d => Layer.fromData(picture, d))
    return new GroupLayerContent(children)
  }
}

export type LayerContentData = ImageLayerContentData | GroupLayerContentData
export type LayerContent = ImageLayerContent | GroupLayerContent