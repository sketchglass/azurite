import * as path from "path"
import {observable, computed, reaction} from "mobx"
import {Vec2, Rect} from "paintvec"
import {Texture} from "paintgl"
import Layer, {LayerData} from "./Layer"
import {GroupLayerContent, ImageLayerContent} from "./LayerContent"
import LayerBlender from "./LayerBlender"
import {UndoStack} from "./UndoStack"
import Navigation from "./Navigation"
import PictureParams from "./PictureParams"
import {frameDebounce} from "../../lib/Debounce"

export
interface PictureData {
  size: [number, number]
  layers: LayerData[]
}

interface PictureUpdate {
  rect?: Rect
  layer?: Layer
}

export default
class Picture {
  readonly size = new Vec2(this.params.width, this.params.height)
  readonly rootLayer: Layer
  readonly selectedLayers = observable<Layer>([])
  readonly layerBlender = new LayerBlender(this)
  readonly undoStack = new UndoStack()
  readonly navigation = observable({
    translation: new Vec2(0),
    scale: 1,
    rotation: 0,
    horizontalFlip: false
  })
  @observable lastUpdate: PictureUpdate = {}
  @observable filePath = ""
  @observable edited = false
  @computed get fileName() {
    if (this.filePath) {
      return path.basename(this.filePath)
    } else {
      return "Untitled"
    }
  }
  @computed get layers() {
    return (this.rootLayer.content as GroupLayerContent).children
  }

  constructor(public params: PictureParams) {
    const defaultLayer = new Layer(this, "Layer", layer => new ImageLayerContent(this, layer))
    this.rootLayer = new Layer(this, "root", layer =>
      new GroupLayerContent(this, layer, [defaultLayer])
    )
    this.selectedLayers.push(defaultLayer)

    reaction(() => this.lastUpdate, frameDebounce((update: PictureUpdate) => {
      this.layerBlender.render(update.rect)
    }))
    this.layerBlender.render()
    this.undoStack.commands.observe(() => {
      this.edited = true
    })
  }

  @computed get currentLayer() {
    if (this.selectedLayers.length > 0) {
      return this.selectedLayers[0]
    }
  }

  dispose() {
    this.layerBlender.dispose()
    for (const layer of this.layers) {
      layer.dispose()
    }
  }

  layerFromPath(path: number[]) {
    return this.rootLayer.descendantFromPath(path)
  }

  toData(): PictureData {
    return {
      size: [this.size.width, this.size.height],
      layers: this.layers.map(l => l.toData()),
    }
  }

  static fromData(data: PictureData) {
    const [width, height] = data.size
    const picture = new Picture({width, height})
    const layers = data.layers.map(l => Layer.fromData(picture, l))
    picture.layers.splice(0, 1, ...layers)
    return picture
  }
}
