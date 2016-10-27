import {observable} from "mobx"
import Picture from "./Picture"
import {LayerContent, GroupLayerContent, ImageLayerContent, LayerContentData} from "./LayerContent"

export
interface LayerData {
  name: string
  content: LayerContentData
}

export default
class Layer {
  @observable name: string
  parent: Layer|undefined
  public readonly content: LayerContent

  constructor(public picture: Picture, name: string, makeContent: (layer: Layer) => LayerContent) {
    this.name = name
    this.content = makeContent(this)
  }

  dispose() {
    this.content.dispose()
  }

  toData(): LayerData {
    const {name} = this
    const content = this.content.toData()
    return {name, content}
  }

  clone(): Layer {
    return new Layer(this.picture, this.name, layer => this.content.clone(layer))
  }

  path(): number[] {
    if (this.parent) {
      if (this.parent.content.type != "group") {
        throw new Error("invalid parent")
      }
      const index = this.parent.content.children.indexOf(this)
      if (index < 0) {
        throw new Error("cannot find in children list")
      }
      return [...this.parent.path(), index]
    } else {
      return []
    }
  }

  descendantFromPath(path: number[]): Layer|undefined {
    if (path.length == 0) {
      return this
    }
    if (this.content.type == "group") {
      return this.content.children[path[0]].descendantFromPath(path.slice(1))
    }
  }

  static fromData(picture: Picture, data: LayerData): Layer {
    const makeContent: (layer: Layer) => LayerContent = layer => {
      switch (data.content.type) {
        default:
        case "image":
          return ImageLayerContent.fromData(layer, data.content)
        case "group":
          return GroupLayerContent.fromData(layer, data.content)
      }
    }
    const layer = new Layer(picture, data.name, makeContent)
    return layer
  }
}
