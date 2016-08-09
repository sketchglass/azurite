import Layer from "./Layer"
import Pointer from "./Pointer"

export default
class Tool {
  layer: Layer
  start(pointer: Pointer) {}
  move(pointer: Pointer) {}
  end() {}
  cursorMove(pointer: Pointer) {}
}
