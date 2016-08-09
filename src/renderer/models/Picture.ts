import Layer from "./Layer"
import {Size} from "../../lib/Geometry"

export default
class Picture {
  size = new Size(1024, 768)
  layers: Layer[] = [new Layer(this.size)]
}
