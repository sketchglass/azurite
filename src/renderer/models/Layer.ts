import {observable, reaction} from "mobx"
import Picture from "./Picture"
import {LayerContent, GroupLayerContent, ImageLayerContent, LayerContentData} from "./LayerContent"

export
type LayerBlendMode = "normal" | "plus" | "multiply" // TODO: add more

export
interface LayerProps {
  name: string
  visible: boolean
  blendMode: LayerBlendMode
  opacity: number
  preserveOpacity: boolean
  clippingGroup: boolean
}

export
interface LayerData extends LayerProps {
  content: LayerContentData
}

export default
class Layer implements LayerProps {
  @observable name: string
  @observable visible: boolean
  @observable blendMode: LayerBlendMode
  @observable opacity: number
  @observable preserveOpacity: boolean
  @observable clippingGroup: boolean
  parent: Layer|undefined
  public readonly content: LayerContent

  constructor(public picture: Picture, props: Partial<LayerProps>, makeContent: (layer: Layer) => LayerContent) {
    this.name = props.name || "Layer"
    this.visible = props.visible != undefined ? props.visible : true
    this.blendMode = props.blendMode || "normal"
    this.opacity = props.opacity != undefined ? props.opacity : 1
    this.preserveOpacity = props.preserveOpacity != undefined ? props.preserveOpacity : false
    this.clippingGroup = props.clippingGroup != undefined ? props.clippingGroup : false

    this.content = makeContent(this)
    reaction(() => [this.visible, this.blendMode, this.opacity, this.clippingGroup], () => {
      picture.lastUpdate = {layer: this}
    })
  }

  get props(): LayerProps {
    const {name, visible, blendMode, opacity, preserveOpacity, clippingGroup} = this
    return {name, visible, blendMode, opacity, preserveOpacity, clippingGroup}
  }

  dispose() {
    this.content.dispose()
  }

  toData(): LayerData {
    const content = this.content.toData()
    return {...this.props, content}
  }

  clone(): Layer {
    return new Layer(this.picture, this.props, layer => this.content.clone(layer))
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
    return new Layer(picture, data, makeContent)
  }
}
