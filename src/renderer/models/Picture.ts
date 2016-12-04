import * as path from "path"
import {observable, computed, reaction} from "mobx"
import {Vec2, Rect} from "paintvec"
import {Texture} from "paintgl"
import Layer, {LayerData} from "./Layer"
import {GroupLayerContent, ImageLayerContent} from "./LayerContent"
import ThumbnailGenerator from "./ThumbnailGenerator"
import LayerBlender from "./LayerBlender"
import {UndoStack} from "./UndoStack"
import {Navigation} from "./Navigation"

export
interface PictureData {
  size: [number, number]
  dpi: number
  layers: LayerData[]
}

interface PictureUpdate {
  rect?: Rect
  layer?: Layer
}

export
interface PictureDimension {
  width: number
  height: number
  dpi: number
}

export default
class Picture {
  @observable dimension: PictureDimension = {width: 0, height: 0, dpi: 72}
  @computed get size() {
    return new Vec2(this.dimension.width, this.dimension.height)
  }
  layerThumbnailGenerator: ThumbnailGenerator

  readonly rootLayer: Layer
  readonly selectedLayers = observable<Layer>([])
  readonly layerBlender = new LayerBlender(this)
  @computed get layers() {
    return (this.rootLayer.content as GroupLayerContent).children
  }

  readonly undoStack = new UndoStack()
  readonly navigation = new Navigation()

  @observable lastUpdate: PictureUpdate = {}
  @observable filePath = ""
  @observable edited = false
  @computed get fileName() {
    if (this.filePath) {
      return path.basename(this.filePath)
    } else {
      return "Untitled"
    }
  }

  private navigatorThumbnailGenerator: ThumbnailGenerator
  private navigatorThumbnailDirty = true
  navigatorThumbnail: HTMLCanvasElement
  navigatorThumbnailScale: number

  constructor(dimension: PictureDimension) {
    reaction(() => this.size, () => this.resizeThumbnailGenerators())
    this.dimension = dimension

    const defaultLayer = new Layer(this, "Layer", layer => new ImageLayerContent(layer))
    this.rootLayer = new Layer(this, "root", layer =>
      new GroupLayerContent(layer, [defaultLayer])
    )
    this.selectedLayers.push(defaultLayer)

    reaction(() => this.lastUpdate, (update: PictureUpdate) => {
      if (update.rect) {
        this.layerBlender.addDirtyRect(update.rect)
      } else {
        this.layerBlender.wholeDirty = true
      }
      this.navigatorThumbnailDirty = true
    })
    this.layerBlender.renderNow()
    this.updateNavigatorThumbnail()
    this.undoStack.commands.observe(() => {
      this.edited = true
    })
  }

  @computed get currentLayer() {
    if (this.selectedLayers.length > 0) {
      return this.selectedLayers[0]
    }
  }

  updateNavigatorThumbnail() {
    if (this.navigatorThumbnailDirty) {
      this.navigatorThumbnailGenerator.loadTexture(this.layerBlender.getBlendedTexture())
      this.navigatorThumbnail = this.navigatorThumbnailGenerator.thumbnail
      this.navigatorThumbnailScale = this.navigatorThumbnailGenerator.scale
      this.navigatorThumbnailDirty = false
    }
  }

  dispose() {
    this.layerThumbnailGenerator.dispose()
    this.navigatorThumbnailGenerator.dispose()
    this.layerBlender.dispose()
    for (const layer of this.layers) {
      layer.dispose()
    }
  }

  layerFromPath(path: number[]) {
    return this.rootLayer.descendantFromPath(path)
  }

  forEachLayer(action: (layer: Layer) => void) {
    this.rootLayer.forEachDescendant(action)
  }

  toData(): PictureData {
    return {
      size: [this.size.width, this.size.height],
      dpi: this.dimension.dpi,
      layers: this.layers.map(l => l.toData()),
    }
  }

  static fromData(data: PictureData) {
    const [width, height] = data.size
    const {dpi} = data
    const picture = new Picture({width, height, dpi})
    const layers = data.layers.map(l => Layer.fromData(picture, l))
    picture.layers.splice(0, 1, ...layers)
    return picture
  }

  private resizeThumbnailGenerators() {
    if (this.layerThumbnailGenerator) {
      this.layerThumbnailGenerator.dispose()
    }
    if (this.navigatorThumbnailGenerator) {
      this.navigatorThumbnailGenerator.dispose()
    }
    this.layerThumbnailGenerator = new ThumbnailGenerator(this.size, new Vec2(40).mulScalar(window.devicePixelRatio))
    this.navigatorThumbnailGenerator = new ThumbnailGenerator(this.size, new Vec2(96, 96).mulScalar(window.devicePixelRatio))
  }
}
