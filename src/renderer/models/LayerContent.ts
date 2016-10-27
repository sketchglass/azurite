import {observable, action, IObservableArray, IArrayChange, IArraySplice} from "mobx"
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

  constructor(public readonly layer: Layer, public tiledTexture: TiledTexture = new TiledTexture()) {
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
    return new ImageLayerContent(layer, this.tiledTexture.clone())
  }

  dispose() {
    this.tiledTexture.dispose()
  }

  static fromData(layer: Layer, data: ImageLayerContentData) {
    const tiledTexture = TiledTexture.fromData(data.image)
    return new ImageLayerContent(layer, tiledTexture)
  }

  @action updateThumbnail() {
    this.thumbnail = this.layer.picture.thumbnailGenerator.generate(this.tiledTexture)
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
  children: IObservableArray<Layer>

  constructor(public readonly layer: Layer, children: Layer[]) {
    this.children = observable(children)
    this.children.observe(change => this.onChildChange(change))
  }

  @action onChildChange(change: IArrayChange<Layer>|IArraySplice<Layer>) {
    if (change.type == "splice") {
      for (const child of change.added) {
        child.parent = this.layer
      }
      for (const child of change.removed) {
        child.parent = undefined
        const selected = this.layer.picture.selectedLayers
        for (let i = selected.length - 1; i >= 0; --i) {
          if (selected[i] == child) {
            selected.splice(i, 1)
          }
        }
      }
    }
  }

  toData(): GroupLayerContentData {
    const children = this.children.map(c => c.toData())
    return {
      type: "group",
      children,
    }
  }

  clone(layer: Layer) {
    return new GroupLayerContent(layer, this.children.map(c => c.clone()))
  }

  dispose() {
    for (let c of this.children) {
      c.dispose()
    }
  }

  static fromData(layer: Layer, data: GroupLayerContentData) {
    const children = data.children.map(d => Layer.fromData(layer.picture, d))
    return new GroupLayerContent(layer, children)
  }
}

export type LayerContentData = ImageLayerContentData | GroupLayerContentData
export type LayerContent = ImageLayerContent | GroupLayerContent
