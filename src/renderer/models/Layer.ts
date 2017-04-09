import {observable, reaction, action, IArrayChange, IArraySplice} from 'mobx'
import IndexPath from '../../lib/IndexPath'
import Picture from './Picture'
import TiledTexture, {TiledTextureData} from './TiledTexture'

export
type LayerBlendMode
  = 'normal'
  | 'plus'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'

export
const layerBlendModes: LayerBlendMode[] = [
  'normal',
  'plus',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
]

export
interface LayerProps {
  name: string
  visible: boolean
  blendMode: LayerBlendMode
  opacity: number
  preserveOpacity: boolean
  clippingGroup: boolean
}

export
type LayerData = ImageLayerData|GroupLayerData

abstract class Layer implements LayerProps {
  @observable name: string
  @observable visible: boolean
  @observable blendMode: LayerBlendMode
  @observable opacity: number
  @observable preserveOpacity: boolean
  @observable clippingGroup: boolean
  parent: GroupLayer|undefined

  constructor(public picture: Picture, props: Partial<LayerProps>) {
    this.name = props.name || 'Layer'
    this.visible = props.visible != undefined ? props.visible : true
    this.blendMode = props.blendMode || 'normal'
    this.opacity = props.opacity != undefined ? props.opacity : 1
    this.preserveOpacity = props.preserveOpacity != undefined ? props.preserveOpacity : false
    this.clippingGroup = props.clippingGroup != undefined ? props.clippingGroup : false

    reaction(() => [this.visible, this.blendMode, this.opacity, this.clippingGroup], () => {
      picture.lastUpdate = {layer: this}
    })
  }

  get props(): LayerProps {
    const {name, visible, blendMode, opacity, preserveOpacity, clippingGroup} = this
    return {name, visible, blendMode, opacity, preserveOpacity, clippingGroup}
  }

  abstract dispose(): void
  abstract toData(): LayerData
  abstract clone(): Layer

  get path(): IndexPath {
    if (this.parent) {
      const index = this.parent.children.indexOf(this)
      if (index < 0) {
        throw new Error('cannot find in children list')
      }
      return this.parent.path.child(index)
    } else {
      return new IndexPath([])
    }
  }

  static fromData(picture: Picture, data: ImageLayerData|GroupLayerData): Layer {
    switch (data.type) {
      case 'image':
        return ImageLayer.fromData(picture, data)
      case 'group':
        return GroupLayer.fromData(picture, data)
    }
  }
}

export default Layer

interface ImageLayerData extends LayerProps {
  type: 'image'
  image: TiledTextureData
}

export
class ImageLayer extends Layer {

  constructor(picture: Picture, props: Partial<LayerProps>, public tiledTexture: TiledTexture = new TiledTexture()) {
    super(picture, props)
  }

  clone() {
    return new ImageLayer(this.picture, this.props, this.tiledTexture.clone())
  }

  dispose() {
    this.tiledTexture.dispose()
  }

  toData(): ImageLayerData {
    const image = this.tiledTexture.toData()
    return {type: 'image', ...this.props, image}
  }

  static fromData(picture: Picture, data: ImageLayerData) {
    const tiledTexture = TiledTexture.fromData(data.image)
    return new ImageLayer(picture, data, tiledTexture)
  }
}

interface GroupLayerData extends LayerProps {
  type: 'group'
  children: LayerData[]
}

export
class GroupLayer extends Layer {
  @observable collapsed = false
  children = observable<Layer>([])

  constructor(picture: Picture, props: Partial<LayerProps>, children: Layer[]) {
    super(picture, props)
    this.children.observe(change => this.onChildChange(change))
    this.children.replace(children)
  }

  clone() {
    return new GroupLayer(this.picture, this.props, this.children.map(c => c.clone()))
  }

  dispose() {
    for (let c of this.children) {
      c.dispose()
    }
  }

  forEachDescendant(action: (layer: Layer) => void) {
    for (const child of this.children) {
      action(child)
      if (child instanceof GroupLayer) {
        child.forEachDescendant(action)
      }
    }
  }

  descendantForPath(path: IndexPath): Layer|undefined {
    if (path.empty) {
      return this
    }
    const {children} = this
    const index = path.at(0)
    if (0 <= index && index < children.length) {
      const child = this.children[index]
      if (path.length === 1) {
        return child
      } else if (child instanceof GroupLayer) {
        return child.descendantForPath(path.slice(1))
      }
    }
  }

  @action private onChildChange(change: IArrayChange<Layer>|IArraySplice<Layer>) {
    const onAdded = (child: Layer) => {
      child.parent = this
    }
    const onRemoved = (child: Layer) => {
      child.parent = undefined
      const selected = this.picture.selectedLayers
      for (let i = selected.length - 1; i >= 0; --i) {
        if (selected[i] === child) {
          selected.splice(i, 1)
        }
      }
    }
    if (change.type === 'splice') {
      change.added.forEach(onAdded)
      change.removed.forEach(onRemoved)
    } else {
      onRemoved(change.oldValue)
      onAdded(change.newValue)
    }
    this.picture.lastUpdate = {}
  }

  toData(): GroupLayerData {
    const children = this.children.map(c => c.toData())
    return {type: 'group', ...this.props, children}
  }

  static fromData(picture: Picture, data: GroupLayerData) {
    const children = data.children.map(c => Layer.fromData(picture, c))
    return new GroupLayer(picture, data, children)
  }
}
