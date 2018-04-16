import {observable, computed, reaction} from 'mobx'
import {Vec2, Rect} from 'paintvec'
import * as path from 'path'
import IndexPath from '../../lib/IndexPath'
import PictureBlender from '../services/PictureBlender'
import Layer, {LayerData, GroupLayer} from './Layer'
import {Navigation} from './Navigation'
import Selection from './Selection'
import {UndoStack} from './UndoStack'

export
interface PictureData {
  size: [number, number]
  dpi: number
  layers: LayerData[]
}

export
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
  static nextID = 0
  readonly id = Picture.nextID++

  @observable dimension: PictureDimension = {width: 0, height: 0, dpi: 72}
  @computed get size() {
    return new Vec2(this.dimension.width, this.dimension.height)
  }
  @computed get rect() {
    return new Rect(new Vec2(), this.size)
  }

  selection: Selection

  readonly rootLayer = new GroupLayer(this, {name: 'root'}, [])
  readonly selectedLayers = observable<Layer>([])
  readonly blender = new PictureBlender(this)
  @computed get layers() {
    return this.rootLayer.children
  }

  readonly undoStack = new UndoStack()
  readonly navigation = new Navigation()

  @observable lastUpdate: PictureUpdate = {}
  @observable filePath = ''
  @observable edited = false
  @computed get fileName() {
    if (this.filePath) {
      return path.basename(this.filePath)
    } else {
      return 'Untitled'
    }
  }

  constructor(dimension: PictureDimension) {
    this.dimension = dimension

    this.selection = new Selection(this.size)

    reaction(() => this.lastUpdate, update => {
      if (update.rect) {
        this.blender.dirtiness.addRect(update.rect)
      } else {
        this.blender.dirtiness.addWhole()
      }
    })
    this.blender.renderNow()
    this.undoStack.commands.observe(() => {
      this.edited = true
    })
  }

  @computed get currentLayer() {
    if (this.selectedLayers.length > 0) {
      return this.selectedLayers[0]
    }
  }

  get selectedPaths() {
    return this.selectedLayers.map(l => l.path)
  }

  dispose() {
    this.blender.dispose()
    for (const layer of this.layers) {
      layer.dispose()
    }
  }

  layerForPath(path: IndexPath) {
    return this.rootLayer.descendantForPath(path)
  }

  get insertPath() {
    return this.currentLayer ? this.currentLayer.path : new IndexPath([0])
  }

  spliceLayers(path: IndexPath, count: number, ...layers: Layer[]) {
    const parentPath = path.parent
    if (!parentPath) {
      throw new Error('invalid path')
    }
    const parent = this.layerForPath(parentPath)
    if (!(parent && parent instanceof GroupLayer)) {
      throw new Error('invalid path')
    }
    return parent.children.splice(path.last, count, ...layers)
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
}
