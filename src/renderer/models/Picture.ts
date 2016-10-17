import {observable, computed, reaction} from "mobx"
import {Vec2, Rect} from "paintvec"
import {Texture} from "paintgl"
import Layer, {LayerData} from "./Layer"
import {Subject} from "rxjs/Subject"
import ThumbnailGenerator from "./ThumbnailGenerator"
import LayerBlender from "./LayerBlender"
import {UndoStack} from "./UndoStack"
import Navigation from "./Navigation"
import PictureParams from "./PictureParams"

export
interface PictureData {
  size: [number, number]
  dpi: number
  layers: LayerData[]
}

export default
class Picture {
  @observable currentLayerIndex = 0
  readonly thumbnailGenerator = new ThumbnailGenerator(this.size)
  readonly layers = observable([new Layer(this)])
  readonly layerBlender = new LayerBlender(this)
  readonly undoStack = new UndoStack()
  readonly navigation = observable({
    translation: new Vec2(0),
    scale: 1,
    rotation: 0,
    horizontalFlip: false
  })
  readonly updated = new Subject<Rect|undefined>()
  @observable filePath = ""
  @observable edited = false

  constructor(public readonly size: Vec2, public readonly dpi: number) {
    Picture.current = this
    this.updated.forEach(() => {
      this.layerBlender.render()
    })
    this.layers.observe(() => {
      this.updated.next()
    })
    this.undoStack.commands.observe(() => {
      this.edited = true
    })
    this.layerBlender.render()
  }

  @computed get currentLayer() {
    return this.layers[this.currentLayerIndex]
  }

  toData(): PictureData {
    return {
      size: [this.size.width, this.size.height],
      dpi: this.dpi,
      layers: this.layers.map(l => l.toData()),
    }
  }

  static fromData(data: PictureData) {
    const [width, height] = data.size
    const picture = new Picture(new Vec2(width, height), data.dpi)
    const layers = data.layers.map(l => Layer.fromData(picture, l))
    picture.layers.splice(0, 1, ...layers)
    return picture
  }

  static current: Picture
}
