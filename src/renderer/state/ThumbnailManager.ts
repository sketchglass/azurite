import {reaction, action} from "mobx"
import {Vec2} from "paintvec"
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import ThumbnailGenerator from "../services/ThumbnailGenerator"
import ObservableWeakMap from "../../lib/ObservableWeakMap"

export default
class ThumbnailManager {
  private layerThumbnailGenerator: ThumbnailGenerator
  private navigatorThumbnailGenerator: ThumbnailGenerator
  private disposers: (() => void)[] = []
  private layerThumbnails = new ObservableWeakMap<Layer, string>()
  get navigatorThumbnail() {
    return this.navigatorThumbnailGenerator.thumbnail
  }
  get navigatorThumbnailScale() {
    return this.navigatorThumbnailGenerator.scale
  }

  constructor(public readonly picture: Picture) {
    this.disposers.push(
      reaction(() => picture.lastUpdate, update => {
        this.updateNavigatorThumbnail()
        if (update.layer) {
          this.updateLayerThumbnail(update.layer)
        }
      }),
      reaction(() => picture.size, () => this.onResize())
    )
    this.onResize()
  }

  private updateNavigatorThumbnail() {
    this.navigatorThumbnailGenerator.loadTexture(this.picture.layerBlender.getBlendedTexture())
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
    return this.layerThumbnails.get(layer)
  }

  @action private onResize() {
    const {size} = this.picture
    if (this.layerThumbnailGenerator) {
      this.layerThumbnailGenerator.dispose()
    }
    if (this.navigatorThumbnailGenerator) {
      this.navigatorThumbnailGenerator.dispose()
    }
    this.layerThumbnailGenerator = new ThumbnailGenerator(size, new Vec2(40).mulScalar(window.devicePixelRatio))
    this.navigatorThumbnailGenerator = new ThumbnailGenerator(size, new Vec2(96, 96).mulScalar(window.devicePixelRatio))

    this.picture.forEachLayer(layer => {
      this.updateLayerThumbnail(layer)
    })

    this.updateNavigatorThumbnail()
  }

  dispose() {
    this.disposers.forEach(f => f())
    this.layerThumbnailGenerator.dispose()
    this.navigatorThumbnailGenerator.dispose()
  }
}