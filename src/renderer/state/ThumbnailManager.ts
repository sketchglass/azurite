import {reaction, action} from "mobx"
import {Vec2} from "paintvec"
import Picture, {PictureUpdate} from "../models/Picture"
import Layer from "../models/Layer"
import ThumbnailGenerator from "../services/ThumbnailGenerator"
import ObservableWeakMap from "../../lib/ObservableWeakMap"

const LAYER_THUMBNAIL_SIZE = new Vec2(40)
const NAVIGATOR_THUMBNAIL_SIZE = new Vec2(96, 96)

export default
class ThumbnailManager {
  private layerThumbnailGenerator: ThumbnailGenerator
  private navigatorThumbnailDirty = true
  private navigatorThumbnailGenerator: ThumbnailGenerator
  private disposers: (() => void)[] = []
  private layerThumbnails = new ObservableWeakMap<Layer, string>()

  get navigatorThumbnail() {
    this.updateNavigatorThumbnail()
    return this.navigatorThumbnailGenerator.thumbnail
  }
  get navigatorThumbnailScale() {
    this.updateNavigatorThumbnail()
    return this.navigatorThumbnailGenerator.scale
  }

  constructor(public readonly picture: Picture) {
    this.disposers.push(
      reaction(() => picture.lastUpdate, update => this.onUpdate(update)),
      reaction(() => picture.size, () => this.onResize()),
    )
    this.onResize()
  }

  private updateNavigatorThumbnail() {
    if (this.navigatorThumbnailDirty) {
      this.navigatorThumbnailGenerator.loadTexture(this.picture.layerBlender.getBlendedTexture())
      this.navigatorThumbnailDirty = false
    }
  }

  private updateLayerThumbnail(layer: Layer) {
    if (layer.content.type != "image") {
      return
    }
    this.layerThumbnailGenerator.loadTiledTexture(layer.content.tiledTexture)
    const thumbnail = this.layerThumbnailGenerator.thumbnail.toDataURL()
    this.layerThumbnails.set(layer, thumbnail)
  }

  thumbnailForLayer(layer: Layer) {
    if (layer.content.type == "image" && !this.layerThumbnails.get(layer)) {
      this.updateLayerThumbnail(layer)
    }
    return this.layerThumbnails.get(layer) || ""
  }

  @action private onUpdate(update: PictureUpdate) {
    this.navigatorThumbnailDirty = true
    if (update.layer) {
      this.updateLayerThumbnail(update.layer)
    }
  }

  @action private onResize() {
    const {size} = this.picture
    if (this.layerThumbnailGenerator) {
      this.layerThumbnailGenerator.dispose()
    }
    if (this.navigatorThumbnailGenerator) {
      this.navigatorThumbnailGenerator.dispose()
    }
    this.layerThumbnailGenerator = new ThumbnailGenerator(size, LAYER_THUMBNAIL_SIZE.mulScalar(window.devicePixelRatio))
    this.navigatorThumbnailGenerator = new ThumbnailGenerator(size, NAVIGATOR_THUMBNAIL_SIZE.mulScalar(window.devicePixelRatio))

    this.navigatorThumbnailDirty = true
    this.picture.forEachLayer(layer => {
      this.updateLayerThumbnail(layer)
    })
  }

  dispose() {
    this.disposers.forEach(f => f())
    this.layerThumbnailGenerator.dispose()
    this.navigatorThumbnailGenerator.dispose()
  }
}
