import Layer from "./Layer"
import {Texture} from "../../lib/GL"
import {Vec2} from "../../lib/Geometry"
import {Subject} from "@reactivex/rxjs/dist/cjs/Subject"
import ThumbnailGenerator from "./ThumbnailGenerator"
import PictureExport from "./PictureExport"
import {context} from "../GLContext"

export default
class Picture {
  size = new Vec2(1024, 768)
  currentLayerIndex = 0
  changed = new Subject<void>()
  thumbnailGenerator = new ThumbnailGenerator(this.size)
  layers: Layer[] = [new Layer(this, this.size)]
  mergedTexture = new Texture(context, this.size)
  pictureExport = new PictureExport(this)

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
