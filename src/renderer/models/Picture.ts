import Layer from "./Layer"
import {Size} from "./Geometry"

export default
class Picture {
  size = new Size(1024, 768)
  layers: Layer[] = [new Layer(this.size)]
}
