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

  constructor(public picture: Picture, name: string, public readonly content: LayerContent) {
    this.name = name
  }

  dispose() {
    this.content.dispose()
  }

  toData(): LayerData {
    const {name} = this
    const content = this.content.toData()
    return {name, content}
  }

  static fromData(picture: Picture, data: LayerData): Layer {
    let content: LayerContent
    switch (data.content.type) {
      default:
      case "image":
        content = ImageLayerContent.fromData(picture, data.content)
        break
      case "group":
        content = GroupLayerContent.fromData(picture, data.content)
        break
    }
    const layer = new Layer(picture, data.name, content)
    return layer
  }
}
