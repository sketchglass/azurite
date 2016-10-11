import {Vec2, Rect} from "paintvec"
import {Texture, PixelType} from "paintgl"
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

  newTile() {
    return new Texture(context, {
      size: new Vec2(TiledTexture.tileSize),
      pixelType: "half-float",
    })
  }

  get(key: Vec2) {
    const keyStr = keyToString(key)
    if (this.tiles.has(keyStr)) {
      return this.tiles.get(keyStr)!
    }
    const tile = this.newTile()
    this.tiles.set(keyStr, tile)
    return tile
  }

  set(key: Vec2, tile: Texture) {
    this.tiles.set(keyToString(key), tile)
  }

  clone() {
    const cloned = new TiledTexture()
    for (const key of this.keys()) {
      const tile = this.newTile()
      copyTexture(this.get(key), tile, new Vec2(0))
      cloned.set(key, tile)
    }
    return cloned
  }

  writeTexture(src: Texture, offset: Vec2) {
    const rect = new Rect(offset, offset.add(src.size))
    for (const key of TiledTexture.keysForRect(rect)) {
      copyTexture(src, this.get(key), key.mulScalar(TiledTexture.tileSize).sub(offset))
    }
  }

  readToTexture(dest: Texture, offset: Vec2) {
    const rect = new Rect(offset, offset.add(dest.size))
    for (const key of TiledTexture.keysForRect(rect)) {
      copyTexture(this.get(key), dest, offset.sub(key.mulScalar(TiledTexture.tileSize)))
    }
  }

  dispose() {
    for (const tile of this.tiles.values()) {
      tile.dispose()
    }
    this.tiles.clear()
  }

  static keysForRect(rect: Rect) {
    const left = Math.floor(rect.left / this.tileSize)
    const right = Math.floor((rect.right - 1) / this.tileSize)
    const top = Math.floor(rect.top / this.tileSize)
    const bottom = Math.floor((rect.bottom - 1) / this.tileSize)
    const keys: Vec2[] = []
    for (let y = top; y <= bottom; ++y) {
      for (let x = left; x <= right; ++x) {
        keys.push(new Vec2(x, y))
      }
    }
    return keys
  }
}
