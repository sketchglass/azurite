import Layer from "./Layer"
import {Texture, Framebuffer} from "../../lib/GL"
import {Vec2, Vec4} from "../../lib/Geometry"
import {Subject} from "@reactivex/rxjs/dist/cjs/Subject"
import ThumbnailGenerator from "./ThumbnailGenerator"
import PictureExport from "./PictureExport"
import LayerBlender from "./LayerBlender"
import {UndoStack} from "./UndoStack"

export default
class Picture {
  size = new Vec2(1024, 768)
  currentLayerIndex = 0
  changed = new Subject<void>()
  thumbnailGenerator = new ThumbnailGenerator(this.size)
  layers: Layer[] = [new Layer(this, this.size)]
  pictureExport = new PictureExport(this)
  layerBlender = new LayerBlender(this)
  undoStack = new UndoStack()

  get currentLayer() {
    return this.layers[this.currentLayerIndex]
  }

  addLayer() {
    this.layers.splice(this.currentLayerIndex, 0, new Layer(this, this.size))
  }
  removeLayer() {
    if (this.layers.length < 2) {
      return
    }
    this.layers.splice(this.currentLayerIndex, 1)
    this.currentLayerIndex = Math.min(this.currentLayerIndex, this.layers.length - 1)
  }

  static current: Picture|undefined
}
