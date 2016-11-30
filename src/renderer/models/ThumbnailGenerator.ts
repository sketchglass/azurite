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

export default
class ThumbnailGenerator {
  thumbnailSize = calcThumbnailSize(this.originalSize, this.maxThumbnailSize)
  private texture = new Texture(context, {size: getBoundingPowerOf2Size(this.originalSize), filter: "trilinear"})
  private drawTarget = new TextureDrawTarget(context, this.texture)
  private thumbnailTexture = new Texture(context, {size: this.thumbnailSize})
  private thumbnailDrawTarget = new TextureDrawTarget(context, this.thumbnailTexture)
  thumbnail = document.createElement("canvas")
  private thumbnailContext = this.thumbnail.getContext("2d")!

  constructor(public originalSize: Vec2, public maxThumbnailSize: Vec2) {
    this.thumbnail.width = this.thumbnailSize.width
    this.thumbnail.height = this.thumbnailSize.height
  }

  loadTiledTexture(tiledTexture: TiledTexture) {
    this.clear()
    tiledTexture.drawToDrawTarget(this.drawTarget, {offset: new Vec2(0), blendMode: "src-over"})
  }

  loadTexture(texture: Texture) {
    this.clear()
    drawTexture(this.drawTarget, texture, {blendMode: "src-over"})
  }

  private clear() {
    this.drawTarget.clear(new Color(1,1,1,1))
  }

  dispose() {
    for (const disposable of [this.texture, this.drawTarget, this.thumbnailTexture, this.thumbnailDrawTarget]) {
      disposable.dispose()
    }
  }
}
