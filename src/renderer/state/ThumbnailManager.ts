import {reaction, action, observable} from "mobx"
import {Vec2} from "paintvec"
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import ThumbnailGenerator from "../services/ThumbnailGenerator"

class LayerThumbnailContainer {
  @observable thumbnail: string = ""
}

export default
class ThumbnailManager {
  private layerThumbnailGenerator: ThumbnailGenerator
  private navigatorThumbnailGenerator: ThumbnailGenerator
  navigatorThumbnail: HTMLCanvasElement
  navigatorThumbnailScale: number
  private disposers: (() => void)[] = []
  layerThumbnails = new WeakMap<Layer, LayerThumbnailContainer>()

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
    this.updateNavigatorThumbnail()
  }

  updateNavigatorThumbnail() {
    this.navigatorThumbnailGenerator.loadTexture(this.picture.layerBlender.getBlendedTexture())
    this.navigatorThumbnail = this.navigatorThumbnailGenerator.thumbnail
    this.navigatorThumbnailScale = this.navigatorThumbnailGenerator.scale
  }

  updateLayerThumbnail(layer: Layer) {
    if (layer.content.type != "image") {
      return
    }
    this.layerThumbnailGenerator.loadTiledTexture(layer.content.tiledTexture)
    if (!this.layerThumbnails.has(layer)) {
      this.layerThumbnails.set(layer, new LayerThumbnailContainer())
    }
    this.layerThumbnails.get(layer)!.thumbnail = this.layerThumbnailGenerator.thumbnail.toDataURL()
  }

  thumbnailForLayer(layer: Layer) {
    const container = this.layerThumbnails.get(layer)
    if (container) {
      return container.thumbnail
    } else {
      return ""
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
    this.layerThumbnailGenerator = new ThumbnailGenerator(size, new Vec2(40).mulScalar(window.devicePixelRatio))
    this.navigatorThumbnailGenerator = new ThumbnailGenerator(size, new Vec2(96, 96).mulScalar(window.devicePixelRatio))

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