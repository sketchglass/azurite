import * as zlib from "zlib"
import {Vec2, Rect} from "paintvec"
import {Texture, PixelType, DrawTarget, TextureDrawTarget, Model, TextureShader, RectShape, BlendMode} from "paintgl"
import {context} from "../GLContext"
import {drawTexture} from "../GLUtil"
import {float32ArrayTo16} from "../../lib/Float"

function keyToString(key: Vec2) {
  return `${key.x},${key.y}`
}

function stringToKey(str: string) {
  const strs = str.split(",")
  return new Vec2(parseInt(strs[0]), parseInt(strs[1]))
}

const tileSize = 256
const tileRect = new Rect(new Vec2(0), new Vec2(tileSize))

const tileModel = new Model(context, {
  shape: new RectShape(context, {usage: "static", rect: tileRect}),
  shader: TextureShader,
  blendMode: "src",
})
const floatTile = new Texture(context, {size: new Vec2(tileSize), pixelType: "float"})
const floatDrawTarget = new TextureDrawTarget(context, floatTile)

function newTile(data?: Uint16Array) {
  return new Texture(context, {
    size: new Vec2(tileSize),
    pixelType: "half-float",
    data
  })
}

function tileToData(tile: Texture) {
  tileModel.uniforms = {texture: tile}
  floatDrawTarget.draw(tileModel)
  const floatData = new Float32Array(tileSize * tileSize * 4)
  floatDrawTarget.readPixels(tileRect, floatData)
  return float32ArrayTo16(floatData)
}

export
interface TiledTextureData {
  tileSize: number
  tiles: [[number, number], Buffer][]
}

export default
class TiledTexture {
  static tileSize = tileSize
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
    const tile = newTile()
    this.tiles.set(keyStr, tile)
    return tile
  }

  set(key: Vec2, tile: Texture) {
    this.tiles.set(keyToString(key), tile)
  }

  clone() {
    const cloned = new TiledTexture()
    const target = new TextureDrawTarget(context)
    for (const key of this.keys()) {
      const tile = newTile()
      target.texture = tile
      drawTexture(target, this.get(key), new Vec2(0), "src")
      cloned.set(key, tile)
    }
    target.dispose()
    return cloned
  }

  drawTexture(src: Texture, offset: Vec2, blendMode: BlendMode) {
    const rect = new Rect(offset, offset.add(src.size))
    const target = new TextureDrawTarget(context)
    for (const key of TiledTexture.keysForRect(rect)) {
      target.texture = this.get(key)
      drawTexture(target, src, offset.sub(key.mulScalar(tileSize)), blendMode)
    }
    target.dispose()
  }

  drawToDrawTarget(dest: DrawTarget, offset: Vec2, blendMode: BlendMode) {
    const rect = new Rect(offset.neg(), offset.neg().add(dest.size))
    for (const key of TiledTexture.keysForRect(rect)) {
      drawTexture(dest, this.get(key), offset.add(key.mulScalar(tileSize)), blendMode)
    }
  }

  toData(): TiledTextureData {
    const tiles = Array.from(this.tiles).map(([key, tile]) => {
      const {x, y} = stringToKey(key)
      const data = tileToData(tile)
      const buffer = Buffer.from(data.buffer)
      const compressed = zlib.deflateSync(buffer)
      const elem: [[number, number], Buffer] = [[x, y], compressed]
      return elem
    })
    return {
      tileSize,
      tiles,
    }
  }

  static fromData(data: TiledTextureData) {
    if (data.tileSize != tileSize) {
      throw new Error("tile size incompatible")
    }
    const tiles = data.tiles.map(([[x, y], compressed]) => {
      const buffer = zlib.inflateSync(compressed)
      const data = new Uint16Array(new Uint8Array(buffer).buffer)
      const tile = newTile(data)
      const key = keyToString(new Vec2(x, y))
      const kv: [string, Texture] = [key, tile]
      return kv
    })
    const tiledTexture = new TiledTexture()
    tiledTexture.tiles = new Map(tiles)
    return tiledTexture
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
