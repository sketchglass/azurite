import {observable, reaction} from "mobx"
import Picture from "./Picture"
import {LayerContent, GroupLayerContent, ImageLayerContent, LayerContentData} from "./LayerContent"

export
interface LayerData {
  name: string
  visible: boolean
  blendMode: LayerBlendMode
  opacity: number
  preserveOpacity: boolean
  clippingGroup: boolean
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
  @observable preserveOpacity = false
  @observable clippingGroup = false
  parent: Layer|undefined
  public readonly content: LayerContent

  constructor(public picture: Picture, name: string, makeContent: (layer: Layer) => LayerContent) {
    this.name = name
    this.content = makeContent(this)
    reaction(() => [this.visible, this.blendMode, this.opacity, this.clippingGroup], () => {
      picture.lastUpdate = {layer: this}
    })
  }

  dispose() {
    this.content.dispose()
  }

  toData(): LayerData {
    const {name, visible, blendMode, opacity, preserveOpacity, clippingGroup} = this
    const content = this.content.toData()
    return {name, visible, blendMode, opacity, content, preserveOpacity, clippingGroup}
  }

  clone(): Layer {
    return new Layer(this.picture, this.name, layer => this.content.clone(layer))
  }

  path(): number[] {
    if (this.parent) {
      const index = this.parent.children.indexOf(this)
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
    const {children} = this
    const index = path[0]
    if (0 <= index && index < children.length) {
      return this.children[index].descendantFromPath(path.slice(1))
    }
  }

  get children() {
    if (this.content.type == "group") {
      return Array.from(this.content.children)
    } else {
      return []
    }
  }

  forEachDescendant(action: (layer: Layer) => void) {
    for (const child of this.children) {
      action(child)
      child.forEachDescendant(action)
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
    const {visible, blendMode, opacity, preserveOpacity, clippingGroup} = data
    layer.visible = visible
    layer.blendMode = blendMode
    layer.opacity = opacity
    layer.preserveOpacity = preserveOpacity
    layer.clippingGroup = clippingGroup
    return layer
  }
}
