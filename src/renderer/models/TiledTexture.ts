import {Vec2, Vec4} from "../../lib/Geometry"
import {Texture, DataType} from "../../lib/GL"
import {context} from "../GLContext"

export default
class TiledTexture {
  static tileSize = 256
  tiles = new Map<string, Texture>()

  has(index: Vec2) {
    return this.tiles.has(index.toString())
  }

  get(index: Vec2) {
    const key = index.toString()
    if (this.tiles.has(key)) {
      return this.tiles.get(key)!
    }
    const tile = new Texture(context, new Vec2(TiledTexture.tileSize), DataType.Byte)
    this.tiles.set(key, tile)
    return tile
  }

  static indicesForRect(rect: Vec4) {
    const left = Math.floor(rect.x / this.tileSize)
    const right = Math.floor((rect.x + rect.z - 1) / this.tileSize)
    const top = Math.floor(rect.y / this.tileSize)
    const bottom = Math.floor((rect.y + rect.w - 1) / this.tileSize)
    const indices: Vec2[] = []
    for (let y = top; y <= bottom; ++y) {
      for (let x = left; x <= right; ++x) {
        indices.push(new Vec2(x, y))
      }
    }
    return indices
  }
}
