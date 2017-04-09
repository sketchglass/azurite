import {Color, Texture, DrawTarget, TextureDrawTarget, BlendMode, RectShape, ShapeModel, colorShader, PixelType} from 'paintgl'
import {Vec2, Rect, Transform} from 'paintvec'
import * as zlib from 'zlib'
import {float32ArrayTo16} from '../../lib/Float'
import {context} from '../GLContext'
import {drawTexture, drawVisibilityToBinary} from '../GLUtil'
import {getBoundingRect} from './util'
const glsl = require('glslify')

export
class Tile {
  texture: Texture
  static width = 256
  static size = new Vec2(Tile.width)
  static rect = new Rect(new Vec2(0), Tile.size)

  constructor(data?: Uint16Array) {
    this.texture = new Texture(context, {
      size: Tile.size,
      pixelType: 'half-float',
      data
    })
  }

  colorAt(pos: Vec2) {
    drawTexture(floatDrawTarget, this.texture, {blendMode: 'src'})
    const data = new Float32Array(4)
    floatDrawTarget.readPixels(Rect.fromSize(pos, new Vec2(1)), data)
    return new Color(data[0], data[1], data[2], data[3])
  }

  boundingRect() {
    drawVisibilityToBinary(binaryDrawTarget, this.texture)
    binaryDrawTarget.readPixels(new Rect(new Vec2(), binaryTexture.size), new Uint8Array(binaryData.buffer))
    return getBoundingRect(binaryData, new Vec2(Tile.width))
  }

  toData() {
    drawTexture(floatDrawTarget, this.texture, {blendMode: 'src'})
    floatDrawTarget.readPixels(Tile.rect, floatData)
    return float32ArrayTo16(floatData)
  }

  clone() {
    const cloned = new Tile()
    tileDrawTarget.texture = cloned.texture
    drawTexture(tileDrawTarget, this.texture, {blendMode: 'src'})
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

export
interface TiledTextureRawData {
  tileSize: number
  tiles: [[number, number], Uint16Array][]
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

  take(key: Vec2) {
    const keyStr = keyToString(key)
    const tile = this.tiles.get(keyStr)
    this.tiles.delete(keyStr)
    return tile
  }

  clone() {
    const cloned = new TiledTexture()
    for (const key of this.keys()) {
      const tile = this.get(key).clone()
      cloned.set(key, tile)
    }
    return cloned
  }

  colorAt(pos: Vec2) {
    const tileKey = pos.divScalar(Tile.width).floor()
    if (this.has(tileKey)) {
      const tile = this.get(tileKey)
      return tile.colorAt(pos.sub(tileKey.mulScalar(Tile.width)))
    } else {
      return new Color(0, 0, 0, 0)
    }
  }

  fill(color: Color, rect: Rect, opts: {clip?: Texture, blendMode?: BlendMode} = {}) {
    if (!fillShape.rect.equals(rect)) {
      fillShape.rect = rect
    }
    let model: ShapeModel
    const {clip} = opts
    if (clip) {
      model = fillModelClipped
      model.uniforms = {color, clip}
    } else {
      model = fillModel
      fillModel.uniforms = {color}
    }
    model.blendMode = opts.blendMode || 'src-over'
    for (const key of TiledTexture.keysForRect(rect)) {
      tileDrawTarget.texture = this.get(key).texture
      model.transform = Transform.translate(key.mulScalar(-Tile.width)),
      tileDrawTarget.draw(model)
    }
  }

  putImage(offset: Vec2, image: ImageData|HTMLVideoElement|HTMLImageElement|HTMLCanvasElement) {
    const texture = new Texture(context, {size: new Vec2(image.width, image.height)})
    texture.setImage(image)
    this.putTexture(offset, texture)
    texture.dispose()
  }

  putTexture(offset: Vec2, texture: Texture) {
    this.drawTexture(texture, {transform: Transform.translate(offset), blendMode: 'src'})
  }

  drawTexture(src: Texture, opts: {transform: Transform, blendMode: BlendMode, bicubic?: boolean, srcRect?: Rect}) {
    const {blendMode, transform, bicubic, srcRect} = opts
    const rect = new Rect(new Vec2(), src.size).transform(transform)
    for (const key of TiledTexture.keysForRect(rect)) {
      tileDrawTarget.texture = this.get(key).texture
      drawTexture(tileDrawTarget, src, {
        transform: transform.translate(key.mulScalar(-Tile.width)),
        blendMode,
        bicubic,
        srcRect
      })
    }
  }

  drawToDrawTarget(dest: DrawTarget, opts: {offset: Vec2, blendMode: BlendMode, transform?: Transform}) {
    const {offset, blendMode, transform} = opts
    let rect = new Rect(offset.neg(), offset.neg().add(dest.size))
    if (transform) {
      rect = rect.transform(transform.invert()!)
    }
    for (const key of TiledTexture.keysForRect(rect)) {
      if (!this.has(key)) {
        continue
      }
      let transform = Transform.translate(key.mulScalar(Tile.width))
      if (opts.transform) {
        transform = transform.merge(opts.transform)
      }
      transform = transform.translate(offset)
      drawTexture(dest, this.get(key).texture, {transform, blendMode})
    }
  }

  cropToTexture(rect: Rect, opts: {pixelType?: PixelType} = {}) {
    const texture = new Texture(context, {
      size: rect.size,
      pixelType: opts.pixelType || 'half-float'
    })
    const drawTarget = new TextureDrawTarget(context, texture)
    this.drawToDrawTarget(drawTarget, {offset: rect.topLeft.neg(), blendMode: 'src'})
    drawTarget.dispose()
    return texture
  }

  transform(transform: Transform) {
    if (transform.equals(new Transform())) {
      return this.clone()
    }
    const result = new TiledTexture()
    const rect = this.boundingRect()
    if (!rect) {
      return result
    }
    const newRect = rect.transform(transform)
    const drawTarget = new TextureDrawTarget(context)
    for (const key of TiledTexture.keysForRect(newRect)) {
      const tile = new Tile()
      drawTarget.texture = tile.texture
      this.drawToDrawTarget(drawTarget, {offset: key.mulScalar(-Tile.width), blendMode: 'src', transform: transform})
      result.set(key, tile)
    }
    result.shrink()
    return result
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

  toRawData(): TiledTextureRawData {
    const tiles = Array.from(this.tiles).map(([key, tile]) => {
      const {x, y} = stringToKey(key)
      const data = tile.toData()
      const elem: [[number, number], Uint16Array] = [[x, y], data]
      return elem
    })
    return {
      tileSize: Tile.width,
      tiles,
    }
  }

  boundingRect() {
    const rects: Rect[] = []
    const keysToDelete = new Set<string>()
    for (const [keyStr, tile] of this.tiles) {
      const key = stringToKey(keyStr)
      const rect = tile.boundingRect()
      if (rect) {
        rects.push(rect.translate(key.mul(Tile.size)))
      } else {
        keysToDelete.add(keyStr)
      }
    }
    for (const keyStr of keysToDelete) {
      const tile = this.tiles.get(keyStr)
      if (tile) {
        tile.dispose()
      }
      this.tiles.delete(keyStr)
    }
    return Rect.union(...rects)
  }

  shrink() {
    this.boundingRect()
  }

  static fromData(data: TiledTextureData) {
    if (data.tileSize !== Tile.width) {
      throw new Error('tile size incompatible')
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

  static fromRawData(data: TiledTextureRawData) {
    if (data.tileSize !== Tile.width) {
      throw new Error('tile size incompatible')
    }
    const tiles = data.tiles.map(([[x, y], data]) => {
      const tile = new Tile(data)
      const key = keyToString(new Vec2(x, y))
      const kv: [string, Tile] = [key, tile]
      return kv
    })
    const tiledTexture = new TiledTexture()
    tiledTexture.tiles = new Map(tiles)
    return tiledTexture
  }

  clear() {
    for (const tile of this.tiles.values()) {
      tile.dispose()
    }
    this.tiles.clear()
  }

  dispose() {
    this.clear()
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

  static unionKeys(...keySets: Iterable<Vec2>[]) {
    const set = new Set<string>()
    for (const keys of keySets) {
      for (const key of keys) {
        set.add(keyToString(key))
      }
    }
    return Array.from(set).map(stringToKey)
  }
}

function keyToString(key: Vec2) {
  return `${key.x},${key.y}`
}

function stringToKey(str: string) {
  const strs = str.split(',')
  return new Vec2(parseInt(strs[0]), parseInt(strs[1]))
}

const floatData = new Float32Array(Tile.width * Tile.width * 4)
const floatTile = new Texture(context, {size: Tile.size, pixelType: 'float'})
const floatDrawTarget = new TextureDrawTarget(context, floatTile)

const binaryData = new Int32Array(Tile.width / 32 * Tile.width)
const binaryTexture = new Texture(context, {size: new Vec2(Tile.width / 32, Tile.width), pixelType: 'byte'})
const binaryDrawTarget = new TextureDrawTarget(context, binaryTexture)

const tileDrawTarget = new TextureDrawTarget(context)

const fillShaderClipped = {
  fragment: glsl`
    uniform sampler2D clip;
    uniform vec4 color;
    void fragmentMain(vec2 pos, vec2 uv, out vec4 outColor) {
      outColor = texture2D(clip, uv).a * color;
    }
  `
}

const fillShape = new RectShape(context)
const fillModel = new ShapeModel(context, {
  shape: fillShape,
  shader: colorShader,
})
const fillModelClipped = new ShapeModel(context, {
  shape: fillShape,
  shader: fillShaderClipped,
})
