import {Vec2, Vec4} from "../../lib/Geometry"
import {Texture, DataType} from "../../lib/GL"
import {context} from "../GLContext"
import {copyTexture} from "../GLUtil"

function keyToString(key: Vec2) {
  return `${key.x},${key.y}`
}

function stringToKey(str: string) {
  const strs = str.split(",")
  return new Vec2(parseInt(strs[0]), parseInt(strs[1]))
}

export default
class TiledTexture {
  static tileSize = 256
  tiles = new Map<string, Texture>()

  has(key: Vec2) {
    return this.tiles.has(keyToString(key))
  }

  keys() {
    return Array.from(this.tiles.keys()).map(stringToKey)
  }

  get(key: Vec2) {
    const keyStr = keyToString(key)
    if (this.tiles.has(keyStr)) {
      return this.tiles.get(keyStr)!
    }
    const tile = new Texture(context, new Vec2(TiledTexture.tileSize), DataType.HalfFloat)
    this.tiles.set(keyStr, tile)
    return tile
  }

  set(key: Vec2, tile: Texture) {
    this.tiles.set(keyToString(key), tile)
  }

  clone() {
    const cloned = new TiledTexture()
    for (const key of this.keys()) {
      const tile = new Texture(context, new Vec2(TiledTexture.tileSize), DataType.HalfFloat)
      copyTexture(this.get(key), tile, new Vec2(0))
      cloned.set(key, tile)
    }
    return cloned
  }

  writeTexture(src: Texture, offset: Vec2) {
    const rect = Vec4.fromVec2(offset, src.size)
    for (const key of TiledTexture.keysForRect(rect)) {
      copyTexture(src, this.get(key), key.mul(TiledTexture.tileSize).sub(offset))
    }
  }

  readToTexture(dest: Texture, offset: Vec2) {
    const rect = Vec4.fromVec2(offset, dest.size)
    for (const key of TiledTexture.keysForRect(rect)) {
      copyTexture(this.get(key), dest, offset.sub(key.mul(TiledTexture.tileSize)))
    }
  }

  dispose() {
    for (const tile of this.tiles.values()) {
      tile.dispose()
    }
    this.tiles.clear()
  }

  static keysForRect(rect: Vec4) {
    const left = Math.floor(rect.x / this.tileSize)
    const right = Math.floor((rect.x + rect.z - 1) / this.tileSize)
    const top = Math.floor(rect.y / this.tileSize)
    const bottom = Math.floor((rect.y + rect.w - 1) / this.tileSize)
    const keys: Vec2[] = []
    for (let y = top; y <= bottom; ++y) {
      for (let x = left; x <= right; ++x) {
        keys.push(new Vec2(x, y))
      }
    }
    return keys
  }
}
