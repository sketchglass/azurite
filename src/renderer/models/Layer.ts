import {Vec2, Transform} from "../../lib/Geometry"
import {Texture} from "../../lib/GL"
import {context} from "../GLContext"

export default
class Layer {
  name = "Layer"
  texture = new Texture(context, this.size)

  constructor(public size: Vec2) {
  }
}
