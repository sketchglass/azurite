import * as zlib from "zlib"
import {Vec2, Rect} from "paintvec"
import {Texture, PixelType, DrawTarget, TextureDrawTarget, Model, TextureShader, RectShape, BlendMode} from "paintgl"
import {context} from "../GLContext"
import {drawTexture} from "../GLUtil"
import {float32ArrayTo16} from "../../lib/Float"

export
class Tile {
  texture: Texture
  static width = 256
  static size = new Vec2(Tile.width)
  static rect = new Rect(new Vec2(0), Tile.size)

  constructor(data?: Uint16Array) {
    this.texture = new Texture(context, {
      size: Tile.size,
      pixelType: "half-float",
      data
    })
  }

  boundingRect() {
    tileModel.uniforms = {texture: this.texture}
    byteAlphaDrawTarget.draw(tileModel)
    const {width, rect} = Tile
    byteAlphaDrawTarget.readPixels(rect, byteAlphaData)

    let hasOpaquePixel = false
    let left = 0, right = 0, top = 0, bottom = 0
    let i = 0
    for (let y = 0; y < width; ++y) {
      for (let x = 0; x < width; ++x) {
        const a = byteAlphaData[i++]
        if (a != 0) {
          if (hasOpaquePixel) {
            left = Math.min(left, x)
            right = Math.max(right, x)
            top = Math.min(top, y)
            bottom = Math.max(bottom, y)
          } else {
            hasOpaquePixel = true
            left = right = x
            top = bottom = y
          }
        }
      }
    }
    if (hasOpaquePixel) {
      return new Rect(new Vec2(left, top), new Vec2(right, bottom))
    }
  }

  toData() {
    tileModel.uniforms = {texture: this.texture}
    floatDrawTarget.draw(tileModel)
    floatDrawTarget.readPixels(Tile.rect, floatData)
    return float32ArrayTo16(floatData)
  }

  clone() {
    const cloned = new Tile()
    tileDrawTarget.texture = cloned.texture
    drawTexture(tileDrawTarget, this.texture, {blendMode: "src"})
    return cloned
  }

  dispose() {
    this.texture.dispose()
  }
}

export
interface TiledTextureData {
  tileSize: number
  tiles: [[number, number], Buffer][]
}

export default
class TiledTexture {
  tiles = new Map<string, Tile>()

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
    const tile = new Tile()
    this.tiles.set(keyStr, tile)
    return tile
  }

  set(key: Vec2, tile: Tile) {
    this.tiles.set(keyToString(key), tile)
  }

  clone() {
    const cloned = new TiledTexture()
    for (const key of this.keys()) {
      const tile = this.get(key).clone()
      cloned.set(key, tile)
    }
    return cloned
  }

  drawTexture(src: Texture, offset: Vec2, blendMode: BlendMode) {
    const rect = new Rect(offset, offset.add(src.size))
    for (const key of TiledTexture.keysForRect(rect)) {
      tileDrawTarget.texture = this.get(key).texture
      drawTexture(tileDrawTarget, src, {offset: offset.sub(key.mulScalar(Tile.width)), blendMode})
    }
  }

  drawToDrawTarget(dest: DrawTarget, offset: Vec2, blendMode: BlendMode) {
    const rect = new Rect(offset.neg(), offset.neg().add(dest.size))
    for (const key of TiledTexture.keysForRect(rect)) {
      if (blendMode == "src-over") {
        if (!this.has(key)) {
          continue
        }
      }
      drawTexture(dest, this.get(key).texture, {offset: offset.add(key.mulScalar(Tile.width)), blendMode})
    }
  }

  toData(): TiledTextureData {
    const tiles = Array.from(this.tiles).map(([key, tile]) => {
      const {x, y} = stringToKey(key)
      const data = tile.toData()
      const buffer = Buffer.from(data.buffer)
      const compressed = zlib.deflateSync(buffer)
      const elem: [[number, number], Buffer] = [[x, y], compressed]
      return elem
    })
    return {
      tileSize: Tile.width,
      tiles,
    }
  }

  static fromData(data: TiledTextureData) {
    if (data.tileSize != Tile.width) {
      throw new Error("tile size incompatible")
    }
    const tiles = data.tiles.map(([[x, y], compressed]) => {
      const buffer = zlib.inflateSync(compressed)
      const data = new Uint16Array(new Uint8Array(buffer).buffer)
      const tile = new Tile(data)
      const key = keyToString(new Vec2(x, y))
      const kv: [string, Tile] = [key, tile]
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
    const left = Math.floor(rect.left / Tile.width)
    const right = Math.floor((rect.right - 1) / Tile.width)
    const top = Math.floor(rect.top / Tile.width)
    const bottom = Math.floor((rect.bottom - 1) / Tile.width)
    const keys: Vec2[] = []
    for (let y = top; y <= bottom; ++y) {
      for (let x = left; x <= right; ++x) {
        keys.push(new Vec2(x, y))
      }
    }
    return keys
  }
}

function keyToString(key: Vec2) {
  return `${key.x},${key.y}`
}

function stringToKey(str: string) {
  const strs = str.split(",")
  return new Vec2(parseInt(strs[0]), parseInt(strs[1]))
}

const tileModel = new Model(context, {
  shape: new RectShape(context, {usage: "static", rect: Tile.rect}),
  shader: TextureShader,
  blendMode: "src",
})

const floatData = new Float32Array(Tile.width * Tile.width * 4)
const floatTile = new Texture(context, {size: Tile.size, pixelType: "float"})
const floatDrawTarget = new TextureDrawTarget(context, floatTile)

const byteAlphaData = new Uint8Array(Tile.width * Tile.width)
const byteAlphaTile = new Texture(context, {size: Tile.size, pixelType: "byte", pixelFormat: "alpha"})
const byteAlphaDrawTarget = new TextureDrawTarget(context, byteAlphaTile)

const tileDrawTarget = new TextureDrawTarget(context)
