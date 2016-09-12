import {Vec2} from "../../lib/Geometry"
import TextureToCanvas from "./TextureToCanvas"
import Layer from "./Layer"

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
const thumbnailSizeMax = new Vec2(64, 48).mul(window.devicePixelRatio)

export default
class ThumbnailGenerator {
  textureToCanvas = new TextureToCanvas(this.size)
  thumbnail = document.createElement("canvas")
  thumbnailContext = this.thumbnail.getContext("2d")!

  constructor(public size: Vec2) {
    const thumbSize = calcThumbnailSize(size, thumbnailSizeMax)
    this.thumbnail.width = thumbSize.width
    this.thumbnail.height = thumbSize.height
  }

  generate(layer: Layer) {
    this.textureToCanvas.loadTexture(layer.texture)
    this.thumbnailContext.drawImage(this.textureToCanvas.canvas, 0, 0, this.thumbnail.width, this.thumbnail.height)
    return this.thumbnail.toDataURL()
  }
}