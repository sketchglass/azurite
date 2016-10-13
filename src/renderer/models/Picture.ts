import {Vec2} from "paintvec"
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
  size = new Vec2(this.params.width, this.params.height)
  currentLayerIndex = 0
  changed = new Subject<void>()
  thumbnailGenerator = new ThumbnailGenerator(this.size)
  layers: Layer[] = [new Layer(this, this.size)]
  layerBlender = new LayerBlender(this)
  undoStack = new UndoStack()
  navigation = {
    translation: new Vec2(0),
    scale: 1,
    rotation: 0,
  }

  constructor(public params: PictureParams) {
    this.changed.forEach(() => {
      this.layerBlender.render()
    })
    this.layerBlender.render()
  }

  get currentLayer() {
    return this.layers[this.currentLayerIndex]
  }

  static current: Picture|undefined
}
