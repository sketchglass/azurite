import {observable, action, IObservableArray, IArrayChange, IArraySplice} from "mobx"
import Picture from "./Picture"
import Layer, {LayerData} from "./Layer"
import TiledTexture, {TiledTextureData} from "./TiledTexture"
import ThumbnailGenerator from "./ThumbnailGenerator"

export
interface ImageLayerContentData {
  type: "image"
  image: TiledTextureData
}

export
class ImageLayerContent {
  type: "image" = "image"
  private readonly thumbnailGenerator: ThumbnailGenerator

  @observable thumbnail = ""

  constructor(private readonly picture: Picture, private readonly layer: Layer, public tiledTexture: TiledTexture = new TiledTexture()) {
    this.thumbnailGenerator = new ThumbnailGenerator(picture.size)
    this.updateThumbnail()
  }

  toData(): ImageLayerContentData {
    const image = this.tiledTexture.toData()
    return {
      type: "image",
      image,
    }
  }

  clone(layer: Layer) {
    return new ImageLayerContent(this.picture, layer, this.tiledTexture.clone())
  }

  dispose() {
    this.thumbnailGenerator.dispose()
    this.tiledTexture.dispose()
  }

  static fromData(picture: Picture, layer: Layer, data: ImageLayerContentData) {
    const tiledTexture = TiledTexture.fromData(data.image)
    return new ImageLayerContent(picture, layer, tiledTexture)
  }

  @action updateThumbnail() {
    this.thumbnail = this.thumbnailGenerator.generate(this.tiledTexture)
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

  @observable collapsed = false
  children = observable<Layer>([])

  constructor(private readonly picture: Picture, private readonly layer: Layer, children: Layer[]) {
    this.children.observe(change => this.onChildChange(change))
    this.children.replace(children)
  }

  @action onChildChange(change: IArrayChange<Layer>|IArraySplice<Layer>) {
    const onAdded = (child: Layer) => {
      child.parent = this.layer
    }
    const onRemoved = (child: Layer) => {
      child.parent = undefined
      const selected = this.picture.selectedLayers
      for (let i = selected.length - 1; i >= 0; --i) {
        if (selected[i] == child) {
          selected.splice(i, 1)
        }
      }
    }
    if (change.type == "splice") {
      change.added.forEach(onAdded)
      change.removed.forEach(onRemoved)
    } else {
      onRemoved(change.oldValue)
      onAdded(change.newValue)
    }
    this.picture.lastUpdate = {}
  }

  toData(): GroupLayerContentData {
    const children = this.children.map(c => c.toData())
    return {
      type: "group",
      children,
    }
  }

  clone(layer: Layer) {
    return new GroupLayerContent(this.picture, layer, this.children.map(c => c.clone()))
  }

  dispose() {
    for (let c of this.children) {
      c.dispose()
    }
  }

  static fromData(picture: Picture, layer: Layer, data: GroupLayerContentData) {
    const children = data.children.map(d => Layer.fromData(picture, d))
    return new GroupLayerContent(picture, layer, children)
  }
}

export type LayerContentData = ImageLayerContentData | GroupLayerContentData
export type LayerContent = ImageLayerContent | GroupLayerContent
