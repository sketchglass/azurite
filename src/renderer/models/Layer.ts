import {Vec2, Transform} from "../../lib/Geometry"
import Picture from "./Picture"
import {Texture} from "../../lib/GL"
import {context} from "../GLContext"

export default
class Layer {
  name = "Layer"
  texture = new Texture(context, this.size)

  constructor(public picture: Picture, public size: Vec2) {
  }
}
