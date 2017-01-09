import * as assert from "power-assert"
import {Vec2} from "paintvec"
import {Color} from "paintgl"
import TiledTexture from "../../renderer/models/TiledTexture"

export default
class TestPattern {
  canvas = document.createElement("canvas")

  constructor() {
    const {canvas} = this
    canvas.width = 100
    canvas.height = 200
    const context = canvas.getContext("2d")!
    context.fillStyle = "red"
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = "blue"
    context.fillRect(10, 20, 30, 40)
  }

  assert(tiledTexture: TiledTexture, offset = new Vec2()) {
    assert.deepEqual(tiledTexture.colorAt(new Vec2(5, 5).add(offset)), new Color(1, 0, 0, 1))
    assert.deepEqual(tiledTexture.colorAt(new Vec2(15, 30).add(offset)), new Color(0, 0, 1, 1))
  }
}
