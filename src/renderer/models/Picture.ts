import Layer from "./Layer"
import {Vec2} from "../../lib/Geometry"
import {Subject} from "@reactivex/rxjs/dist/cjs/Subject"

export default
class Picture {
  size = new Vec2(1024, 768)
  layers: Layer[] = [new Layer(this, this.size)]
  currentLayerIndex = 0
  changed = new Subject<void>()

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
}
