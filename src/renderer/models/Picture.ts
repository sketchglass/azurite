import Layer from "./Layer"
import {Texture, Framebuffer} from "../../lib/GL"
import {Vec2, Vec4} from "../../lib/Geometry"
import {Subject} from "@reactivex/rxjs/dist/cjs/Subject"
import ThumbnailGenerator from "./ThumbnailGenerator"
import LayerBlender from "./LayerBlender"
import {UndoStack} from "./UndoStack"
import Navigation from "./Navigation"

export default
class Picture {
  size = new Vec2(1024, 768)
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

  constructor() {
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
