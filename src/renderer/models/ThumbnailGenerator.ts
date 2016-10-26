import {Vec2, Rect} from "paintvec"
import {Texture, TextureDrawTarget, Color, RectShape, } from "paintgl"
import TextureToCanvas from "./TextureToCanvas"
import TiledTexture from "./TiledTexture"
import {context} from "../GLContext"
import {drawTexture} from "../GLUtil"

function calcThumbnailSize(layerSize: Vec2, maxSize: Vec2) {
  const maxRatio = maxSize.width / maxSize.height
  const ratio = layerSize.width / layerSize.height
  if (ratio > maxRatio) {
    // clamp to width
    return new Vec2(maxSize.width, Math.round(maxSize.width / ratio))
  } else {
    // clamp to height
    return new Vec2(Math.round(maxSize.height * ratio), maxSize.height)
  }
}

function getBoundingPowerOf2(x: number) {
  let ret = 1
  while (true) {
    if (x <= ret) {
      return ret
    }
    ret *= 2
  }
}

function getBoundingPowerOf2Size(size: Vec2) {
  return new Vec2(getBoundingPowerOf2(size.width), getBoundingPowerOf2(size.height))
}


const thumbnailSizeMax = new Vec2(64, 48).mulScalar(window.devicePixelRatio)

export default
class ThumbnailGenerator {
  thumbnailSize = calcThumbnailSize(this.size, thumbnailSizeMax)
  texture = new Texture(context, {size: getBoundingPowerOf2Size(this.size), filter: "mipmap-bilinear"})
  drawTarget = new TextureDrawTarget(context, this.texture)
  thumbnailTexture = new Texture(context, {size: this.thumbnailSize})
  thumbnailDrawTarget = new TextureDrawTarget(context, this.thumbnailTexture)
  thumbnail = document.createElement("canvas")
  thumbnailContext = this.thumbnail.getContext("2d")!

  constructor(public size: Vec2) {
    const thumbSize = calcThumbnailSize(size, thumbnailSizeMax)
    this.thumbnail.width = thumbSize.width
    this.thumbnail.height = thumbSize.height
  }

  generate(tiledTexture: TiledTexture) {
    this.drawTarget.clear(new Color(1,1,1,1))
    tiledTexture.drawToDrawTarget(this.drawTarget, new Vec2(0), "src-over")
    this.texture.generateMipmap()

    const rect = new Rect(new Vec2(0), this.thumbnailSize.mul(this.texture.size.div(this.size)))
    drawTexture(this.thumbnailDrawTarget, this.texture, {rect, blendMode: "src"})

    const {width, height} = rect
    const data = new ImageData(width, height)
    this.thumbnailDrawTarget.readPixels(rect, new Uint8Array(data.data.buffer))
    this.thumbnailContext.putImageData(data, 0, 0)

    return this.thumbnail.toDataURL()
  }

  dispose() {
    for (const disposable of [this.texture, this.drawTarget, this.thumbnailTexture, this.thumbnailDrawTarget]) {
      disposable.dispose()
    }
  }
}
