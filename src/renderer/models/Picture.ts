import Layer from "./Layer"
import {Vec2} from "../../lib/Geometry"
import {Subject} from "@reactivex/rxjs"

export default
class Picture {
  size = new Vec2(1024, 768)
  layers: Layer[] = [new Layer(this.size)]
  currentLayerIndex = 0
  layersChanged = new Subject<void>()
  currentLayerChanged = new Subject<void>()

  get currentLayer() {
    return this.layers[this.currentLayerIndex]
  }
}
