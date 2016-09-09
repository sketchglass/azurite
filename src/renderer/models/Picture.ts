import Layer from "./Layer"
import {Vec2} from "../../lib/Geometry"
import {Subject} from "@reactivex/rxjs"

export default
class Picture {
  size = new Vec2(1024, 768)
  layers: Layer[] = [new Layer(this.size)]
  layersChanged = new Subject<void>()
}
