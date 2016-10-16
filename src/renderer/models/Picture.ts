import {observable, computed, reaction} from "mobx"
import {Vec2, Rect} from "paintvec"
import {Texture} from "paintgl"
import Layer from "./Layer"
import {Subject} from "@reactivex/rxjs/dist/cjs/Subject"
import ThumbnailGenerator from "./ThumbnailGenerator"
import LayerBlender from "./LayerBlender"
import {UndoStack} from "./UndoStack"
import Navigation from "./Navigation"
import PictureParams from "./PictureParams"

export default
class Picture {
  readonly size = new Vec2(this.params.width, this.params.height)
  @observable currentLayerIndex = 0
  readonly thumbnailGenerator = new ThumbnailGenerator(this.size)
  readonly layers = observable([new Layer(this, this.size)])
  readonly layerBlender = new LayerBlender(this)
  readonly undoStack = new UndoStack()
  readonly navigation = observable({
    translation: new Vec2(0),
    scale: 1,
    rotation: 0,
  })
  readonly updated = new Subject<Rect|undefined>()

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

  static current: Picture|undefined
}
