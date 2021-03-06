import {Color} from 'paintgl'
import {Transform, Rect} from 'paintvec'
import IndexPath from '../../lib/IndexPath'
import Layer, {LayerProps, GroupLayer, ImageLayer} from '../models/Layer'
import Picture from '../models/Picture'
import TiledTexture from '../models/TiledTexture'
import {UndoCommand, CompositeUndoCommand} from '../models/UndoStack'
import {layerBlender} from '../services/LayerBlender'
import LayerTransform from '../services/LayerTransform'
import {SelectionChangeCommand} from './SelectionCommand'

export
class MoveLayerCommand implements UndoCommand {
  dstPathAfter = this.dstPath.afterRemove(this.srcPaths)

  title = 'Move Layers'

  constructor(public readonly picture: Picture, public readonly srcPaths: IndexPath[], public readonly dstPath: IndexPath) {
  }

  undo() {
    const srcs = this.picture.spliceLayers(this.dstPathAfter, this.srcPaths.length)

    for (const [i, srcPath] of this.srcPaths.entries()) {
      this.picture.spliceLayers(srcPath, 0, srcs[i])
    }
    this.picture.selectedLayers.replace(srcs)
  }

  redo() {
    const srcs: Layer[] = []
    for (const srcPath of [...this.srcPaths].reverse()) {
      const src = this.picture.spliceLayers(srcPath, 1)[0]
      srcs.unshift(src)
    }

    this.picture.spliceLayers(this.dstPathAfter, 0, ...srcs)
    this.picture.selectedLayers.replace(srcs)
  }
}

export
class CopyLayerCommand implements UndoCommand {
  title = 'Copy Layers'

  constructor(public readonly picture: Picture, public readonly srcPaths: IndexPath[], public readonly dstPath: IndexPath) {
  }

  undo() {
    this.picture.spliceLayers(this.dstPath, this.srcPaths.length)
  }

  redo() {
    const srcs: Layer[] = []
    for (const srcPath of [...this.srcPaths].reverse()) {
      const src = this.picture.layerForPath(srcPath)!.clone()
      srcs.unshift(src)
    }

    this.picture.spliceLayers(this.dstPath, 0, ...srcs)
  }
}

export
class GroupLayerCommand implements UndoCommand {
  title = 'Group Layers'

  constructor(public readonly picture: Picture, public readonly srcPaths: IndexPath[]) {
  }

  undo() {
    const group = this.picture.spliceLayers(this.srcPaths[0], 1)[0]
    if (!(group instanceof GroupLayer)) {
      return
    }
    const {children} = group
    const srcs = children.splice(0, children.length)

    for (const [i, srcPath] of this.srcPaths.entries()) {
      this.picture.spliceLayers(srcPath, 0, srcs[i])
    }

    group.dispose()
    this.picture.selectedLayers.replace(srcs)
  }

  redo() {
    const srcs: Layer[] = []
    for (const srcPath of [...this.srcPaths].reverse()) {
      const src = this.picture.spliceLayers(srcPath, 1)[0]
      srcs.unshift(src)
    }
    const group = new GroupLayer(this.picture, {name: 'Group'}, srcs)

    this.picture.spliceLayers(this.srcPaths[0], 0, group)
    this.picture.selectedLayers.replace([group])
  }
}

export
class MergeLayerCommand implements UndoCommand {
  title = 'Merge Layers'
  srcs: Layer[] = []

  constructor(public readonly picture: Picture, public readonly srcPaths: IndexPath[]) {
  }

  undo() {
    const merged = this.picture.spliceLayers(this.srcPaths[0], 1)[0]
    merged.dispose()

    for (const [i, srcPath] of this.srcPaths.entries()) {
      this.picture.spliceLayers(srcPath, 0, this.srcs[i])
    }

    this.picture.selectedLayers.replace(this.srcs)
  }

  redo() {
    const srcs: Layer[] = []
    for (const srcPath of [...this.srcPaths].reverse()) {
      const src = this.picture.spliceLayers(srcPath, 1)[0]
      srcs.unshift(src)
    }
    this.srcs = srcs
    let merged: ImageLayer
    if (srcs.length === 1 && srcs[0] instanceof GroupLayer) {
      const group = srcs[0] as GroupLayer
      merged = new ImageLayer(this.picture, group.props, layerBlender.blendToTiledTexture(group.children))
    } else {
      merged = new ImageLayer(this.picture, {name: 'Merged'}, layerBlender.blendToTiledTexture(srcs))
    }

    this.picture.spliceLayers(this.srcPaths[0], 0, merged)
    this.picture.selectedLayers.replace([merged])
  }
}

export
class AddLayerCommand implements UndoCommand {
  title = 'Add Layer'

  constructor(public readonly picture: Picture, public readonly path: IndexPath, public layer: Layer) {
  }

  undo() {
    this.picture.spliceLayers(this.path, 1)
    const nextLayer = this.picture.layerForPath(this.path)
    if (nextLayer) {
      this.picture.selectedLayers.replace([nextLayer])
    }
  }
  redo() {
    this.picture.spliceLayers(this.path, 0, this.layer)
    this.picture.selectedLayers.replace([this.layer])
  }
}

export
class RemoveLayerCommand implements UndoCommand {
  title = 'Remove Layers'

  removedLayers: Layer[] = []
  constructor(public picture: Picture, public paths: IndexPath[]) {
  }
  undo() {
    for (const [i, path] of this.paths.entries()) {
      this.picture.spliceLayers(path, 0, this.removedLayers[i])
    }
    this.picture.selectedLayers.replace(this.removedLayers)
  }
  redo() {
    const removedLayers: Layer[] = []
    for (const path of [...this.paths].reverse()) {
      const removed = this.picture.spliceLayers(path, 1)[0]
      removedLayers.unshift(removed)
    }
    this.removedLayers = removedLayers
    this.reselect()
  }
  reselect() {
    const nextPath = this.paths[0]
    const parentPath = nextPath.parent
    if (!parentPath) {
      return
    }
    const prevPath = parentPath.child(nextPath.last - 1)
    const nextLayer = this.picture.layerForPath(nextPath)
    const prevLayer = this.picture.layerForPath(prevPath)
    const parentLayer = this.picture.layerForPath(parentPath)
    const selectedLayers = nextLayer ? [nextLayer] : prevLayer ? [prevLayer] : (parentLayer && parentLayer.parent) ? [parentLayer] : []
    this.picture.selectedLayers.replace(selectedLayers)
  }
}

export
class ChangeLayerPropsCommand implements UndoCommand {
  oldProps: LayerProps

  constructor(public picture: Picture, public path: IndexPath, public title: string, public props: Partial<LayerProps>) {
  }
  undo() {
    const layer = this.picture.layerForPath(this.path)
    if (layer) {
      Object.assign(layer, this.oldProps)
    }
  }
  redo() {
    const layer = this.picture.layerForPath(this.path)
    if (layer) {
      this.oldProps = layer.props
      Object.assign(layer, this.props)
    }
  }
}

export
class ChangeLayerImageCommand implements UndoCommand {
  oldTiles = new TiledTexture()

  constructor(public picture: Picture, public path: IndexPath, public title: string, public newTiles: TiledTexture, public rect?: Rect) {
  }

  private notifyChange(layer: ImageLayer) {
    const {rect} = this
    layer.picture.lastUpdate = {layer, rect}
  }

  undo() {
    const layer = this.picture.layerForPath(this.path)
    if (!(layer && layer instanceof ImageLayer)) {
      return
    }
    for (const key of this.newTiles.keys()) {
      if (this.oldTiles.has(key)) {
        layer.tiledTexture.set(key, this.oldTiles.take(key)!)
      } else {
        layer.tiledTexture.take(key)
      }
    }
    this.notifyChange(layer)
  }

  redo() {
    const layer = this.picture.layerForPath(this.path)
    if (!(layer && layer instanceof ImageLayer)) {
      return
    }
    for (const key of this.newTiles.keys()) {
      if (layer.tiledTexture.has(key)) {
        this.oldTiles.set(key, layer.tiledTexture.take(key)!)
      }
      layer.tiledTexture.set(key, this.newTiles.get(key).clone())
    }
    this.notifyChange(layer)
  }
}

abstract class ReplaceLayerImageCommand implements UndoCommand {
  abstract title: string
  abstract createNewTiledTexture(original: TiledTexture): TiledTexture
  private oldTiles: TiledTexture|undefined

  constructor(public picture: Picture, public path: IndexPath) {
  }

  undo() {
    const layer = this.picture.layerForPath(this.path)
    if (!(layer && layer instanceof ImageLayer)) {
      return
    }
    if (!this.oldTiles) {
      return
    }
    layer.tiledTexture = this.oldTiles
    this.oldTiles = undefined

    this.picture.lastUpdate = {layer}
  }

  redo() {
    const layer = this.picture.layerForPath(this.path)
    if (!(layer && layer instanceof ImageLayer)) {
      return
    }
    this.oldTiles = layer.tiledTexture
    layer.tiledTexture = this.createNewTiledTexture(this.oldTiles)

    this.picture.lastUpdate = {layer}
  }
}

export
class TransformLayerCommand implements UndoCommand {
  title = 'Transform Layer'
  oldTiledTexture: TiledTexture|undefined
  selectionChangeCommand: SelectionChangeCommand|undefined

  constructor(public picture: Picture, public path: IndexPath, public transform: Transform, public transformsSelection: boolean) {
  }

  undo() {
    if (this.selectionChangeCommand) {
      this.selectionChangeCommand.undo()
    }
    const layer = this.picture.layerForPath(this.path)
    if (!(layer && layer instanceof ImageLayer)) {
      return
    }
    if (!this.oldTiledTexture) {
      return
    }
    const transformed = layer.tiledTexture
    layer.tiledTexture = this.oldTiledTexture
    transformed.dispose()
    this.picture.lastUpdate = {layer}
  }

  redo() {
    const layer = this.picture.layerForPath(this.path)
    if (!(layer && layer instanceof ImageLayer)) {
      return
    }
    const layerTransform = new LayerTransform(layer.tiledTexture, this.picture.selection)
    layerTransform.transform = this.transform

    this.oldTiledTexture = layer.tiledTexture
    layer.tiledTexture = layerTransform.transformToTiledTexture()

    if (this.transformsSelection && this.picture.selection.hasSelection) {
      this.selectionChangeCommand = new SelectionChangeCommand(this.picture, layerTransform.transformSelection())
      this.selectionChangeCommand.redo()
    } else {
      this.selectionChangeCommand = undefined
    }

    layerTransform.dispose()

    this.picture.lastUpdate = {layer}
  }
}

export
class FillLayerCommand extends ReplaceLayerImageCommand {
  title = 'Fill Layer'

  constructor(picture: Picture, path: IndexPath, public color: Color) {
    super(picture, path)
  }

  createNewTiledTexture(original: TiledTexture) {
    const tiledTexture = original.clone()
    const {selection} = this.picture
    tiledTexture.fill(this.color, this.picture.rect, {
      clip: selection.hasSelection ? selection.texture : undefined
    })
    return tiledTexture
  }
}

export
class ClearLayerCommand extends ReplaceLayerImageCommand {
  title = 'Clear Layer'

  constructor(picture: Picture, path: IndexPath) {
    super(picture, path)
  }

  createNewTiledTexture(original: TiledTexture) {
    const {selection} = this.picture
    if (selection.hasSelection) {
      const tiledTexture = original.clone()
      tiledTexture.fill(new Color(1, 1, 1, 1), this.picture.rect, {
        clip: selection.texture,
        blendMode: 'dst-out',
      })
      return tiledTexture
    } else {
      return new TiledTexture()
    }
  }
}

export
class ClearLayersCommand extends CompositeUndoCommand {
  constructor(public picture: Picture, public paths: IndexPath[]) {
    super('Clear Layers', paths.map(path => new ClearLayerCommand(picture, path)))
  }
}
