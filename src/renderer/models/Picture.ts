import {observable, computed, reaction} from "mobx"
import msgpack = require("msgpack-lite")
import fs = require("fs")
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
  layers: LayerData[]
}

export default
class Picture {
  readonly size = new Vec2(this.params.width, this.params.height)
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

  constructor(public params: PictureParams) {
    this.updated.forEach(() => {
      this.layerBlender.render()
    })
    this.layers.observe(() => {
      this.updated.next()
    })
    this.layerBlender.render()
  }

  @computed get currentLayer() {
    return this.layers[this.currentLayerIndex]
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

  saveAs(filePath: string) {
    const fileData = msgpack.encode(this.toData())
    fs.writeFileSync(filePath, fileData)
    this.filePath = filePath
  }

  static open(filePath: string) {
    const fileData = fs.readFileSync(filePath)
    const picture = this.fromData(msgpack.decode(fileData))
    picture.filePath = filePath
    return picture
  }

  static current: Picture|undefined
}
