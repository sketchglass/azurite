import {observable, reaction} from "mobx"
import Picture from "./Picture"
import {LayerContent, GroupLayerContent, ImageLayerContent, LayerContentData} from "./LayerContent"

export
interface LayerData {
  name: string
  visible: boolean
  blendMode: LayerBlendMode
  opacity: number
  content: LayerContentData
}

export
type LayerBlendMode = "normal" | "plus" | "multiply" // TODO: add more

export default
class Layer {
  @observable name: string
  @observable visible = true
  @observable blendMode: LayerBlendMode = "normal"
  @observable opacity = 1
  parent: Layer|undefined
  public readonly content: LayerContent

  constructor(private picture: Picture, name: string, makeContent: (layer: Layer) => LayerContent) {
    this.name = name
    this.content = makeContent(this)
    reaction(() => [this.visible, this.blendMode, this.opacity], () => {
      picture.lastUpdate = {layer: this}
    })
  }

  dispose() {
    this.content.dispose()
  }

  toData(): LayerData {
    const {name, visible, blendMode, opacity} = this
    const content = this.content.toData()
    return {name, visible, blendMode, opacity, content}
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
      const {children} = this.content
      const index = path[0]
      if (index < children.length) {
        return this.content.children[index].descendantFromPath(path.slice(1))
      }
    }
  }

  static fromData(picture: Picture, data: LayerData): Layer {
    const makeContent: (layer: Layer) => LayerContent = layer => {
      switch (data.content.type) {
        default:
        case "image":
          return ImageLayerContent.fromData(picture, layer, data.content)
        case "group":
          return GroupLayerContent.fromData(picture, layer, data.content)
      }
    }
    const layer = new Layer(picture, data.name, makeContent)
    const {visible, blendMode, opacity} = data
    layer.visible = visible
    layer.blendMode = blendMode
    layer.opacity = opacity
    return layer
  }
}
