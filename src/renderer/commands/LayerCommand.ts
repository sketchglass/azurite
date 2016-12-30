import {Transform} from "paintvec"
import {IObservableArray} from "mobx"
import {Rect} from "paintvec"
import {UndoCommand} from "../models/UndoStack"
import Picture from "../models/Picture"
import Layer, {LayerProps, GroupLayer, ImageLayer} from "../models/Layer"
import TiledTexture from "../models/TiledTexture"
import LayerTransform from "../services/LayerTransform"
import {SelectionChangeCommand} from "./SelectionCommand"

function getSiblingsAndIndex(picture: Picture, path: number[]): [IObservableArray<Layer>, number] {
  const parent = picture.layerFromPath(path.slice(0, -1))
  if (!(parent && parent instanceof GroupLayer)) {
    throw new Error("invalid path")
  }
  const index = path[path.length - 1]
  return [parent.children, index]
}

function isUpperSibling(path: number[], from: number[]) {
  if (path.length != from.length) {
    return false
  }
  const count = path.length
  for (let i = 0; i < count - 1; ++i) {
    if (path[i] != from[i]) {
      return false
    }
  }
  return path[count - 1] < from[count - 1]
}

function dstPathAfterMove(srcPaths: number[][], dstPath: number[]) {
  const newDstPath = [...dstPath]
  for (let len = dstPath.length; len > 0; --len) {
    const subPath = dstPath.slice(0, len)
    for (const srcPath of srcPaths) {
      if (isUpperSibling(srcPath, subPath)) {
        newDstPath[len - 1]--
      }
    }
  }
  return newDstPath
}

export
class MoveLayerCommand implements UndoCommand {
  dstPathAfter = dstPathAfterMove(this.srcPaths, this.dstPath)

  title = "Move Layers"

  constructor(public readonly picture: Picture, public readonly srcPaths: number[][], public readonly dstPath: number[]) {
  }

  undo() {
    const [dstSiblings, dstIndex] = getSiblingsAndIndex(this.picture, this.dstPathAfter)
    const srcs = dstSiblings.splice(dstIndex, this.srcPaths.length)

    for (const [i, srcPath] of this.srcPaths.entries()) {
      const [srcSiblings, srcIndex] = getSiblingsAndIndex(this.picture, srcPath)
      srcSiblings.splice(srcIndex, 0, srcs[i])
    }
    this.picture.selectedLayers.replace(srcs)
  }

  redo() {
    const srcs: Layer[] = []
    for (const srcPath of [...this.srcPaths].reverse()) {
      const [srcSiblings, srcIndex] = getSiblingsAndIndex(this.picture, srcPath)
      const src = srcSiblings.splice(srcIndex, 1)[0]
      srcs.unshift(src)
    }

    const [dstSiblings, dstIndex] = getSiblingsAndIndex(this.picture, this.dstPathAfter)
    dstSiblings.splice(dstIndex, 0, ...srcs)
    this.picture.selectedLayers.replace(srcs)
  }
}

export
class CopyLayerCommand implements UndoCommand {
  title = "Copy Layers"

  constructor(public readonly picture: Picture, public readonly srcPaths: number[][], public readonly dstPath: number[]) {
  }

  undo() {
    const [dstSiblings, dstIndex] = getSiblingsAndIndex(this.picture, this.dstPath)
    dstSiblings.splice(dstIndex, this.srcPaths.length)
  }

  redo() {
    const srcs: Layer[] = []
    for (const srcPath of [...this.srcPaths].reverse()) {
      const [srcSiblings, srcIndex] = getSiblingsAndIndex(this.picture, srcPath)
      const src = srcSiblings[srcIndex].clone()
      srcs.unshift(src)
    }

    const [dstSiblings, dstIndex] = getSiblingsAndIndex(this.picture, this.dstPath)
    dstSiblings.splice(dstIndex, 0, ...srcs)
  }
}

export
class GroupLayerCommand implements UndoCommand {
  title = "Group Layers"

  constructor(public readonly picture: Picture, public readonly srcPaths: number[][]) {
  }

  undo() {
    const [dstSiblings, dstIndex] = getSiblingsAndIndex(this.picture, this.srcPaths[0])
    const group = dstSiblings.splice(dstIndex, 1)[0]
    if (!(group instanceof GroupLayer)) {
      return
    }
    const {children} = group
    const srcs = children.splice(0, children.length)

    for (const [i, srcPath] of this.srcPaths.entries()) {
      const [srcSiblings, srcIndex] = getSiblingsAndIndex(this.picture, srcPath)
      srcSiblings.splice(srcIndex, 0, srcs[i])
    }

    group.dispose()
    this.picture.selectedLayers.replace(srcs)
  }

  redo() {
    const srcs: Layer[] = []
    for (const srcPath of [...this.srcPaths].reverse()) {
      const [srcSiblings, srcIndex] = getSiblingsAndIndex(this.picture, srcPath)
      const src = srcSiblings.splice(srcIndex, 1)[0]
      srcs.unshift(src)
    }
    const group = new GroupLayer(this.picture, {name: "Group"}, srcs)

    const [dstSiblings, dstIndex] = getSiblingsAndIndex(this.picture, this.srcPaths[0])
    dstSiblings.splice(dstIndex, 0, group)
    this.picture.selectedLayers.replace([group])
  }
}

export
class AddLayerCommand implements UndoCommand {
  title = "Add Layer"

  constructor(public readonly picture: Picture, public readonly path: number[], public layer: Layer) {
  }

  undo() {
    const [siblings, index] = getSiblingsAndIndex(this.picture, this.path)
    siblings.splice(index, 1)
    const nextLayer = this.picture.layerFromPath(this.path)
    if (nextLayer) {
      this.picture.selectedLayers.replace([nextLayer])
    }
  }
  redo() {
    const [siblings, index] = getSiblingsAndIndex(this.picture, this.path)
    siblings.splice(index, 0, this.layer)
    this.picture.selectedLayers.replace([this.layer])
  }
}

export
class RemoveLayerCommand implements UndoCommand {
  title = "Remove Layers"

  removedLayers: Layer[] = []
  constructor(public picture: Picture, public paths: number[][]) {
  }
  undo() {
    for (const [i, path] of this.paths.entries()) {
      const [siblings, index] = getSiblingsAndIndex(this.picture, path)
      siblings.splice(index, 0, this.removedLayers[i])
    }
    this.picture.selectedLayers.replace(this.removedLayers)
  }
  redo() {
    const removedLayers: Layer[] = []
    for (const path of [...this.paths].reverse()) {
      const [siblings, index] = getSiblingsAndIndex(this.picture, path)
      const removed = siblings.splice(index, 1)[0]
      removedLayers.unshift(removed)
    }
    this.removedLayers = removedLayers
    this.reselect()
  }
  reselect() {
    const nextPath = this.paths[0]
    const parentPath = nextPath.slice(0, -1)
    const prevPath = [...parentPath, nextPath[nextPath.length - 1] - 1]
    const nextLayer = this.picture.layerFromPath(nextPath)
    const prevLayer = this.picture.layerFromPath(prevPath)
    const parentLayer = this.picture.layerFromPath(parentPath)
    const selectedLayers = nextLayer ? [nextLayer] : prevLayer ? [prevLayer] : parentLayer ? [parentLayer] : []
    this.picture.selectedLayers.replace(selectedLayers)
  }
}

export
class ChangeLayerPropsCommand implements UndoCommand {
  oldProps: LayerProps

  constructor(public picture: Picture, public path: number[], public title: string, public props: Partial<LayerProps>) {
  }
  undo() {
    const layer = this.picture.layerFromPath(this.path)
    if (layer) {
      Object.assign(layer, this.oldProps)
    }
  }
  redo() {
    const layer = this.picture.layerFromPath(this.path)
    if (layer) {
      this.oldProps = layer.props
      Object.assign(layer, this.props)
    }
  }
}

export
class ChangeLayerImageCommand implements UndoCommand {
  oldTiles = new TiledTexture()

  constructor(public picture: Picture, public path: number[], public title: string, public newTiles: TiledTexture, public rect?: Rect) {
  }

  private notifyChange(layer: ImageLayer) {
    const {rect} = this
    layer.picture.lastUpdate = {layer, rect}
  }

  undo() {
    const layer = this.picture.layerFromPath(this.path)
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
    const layer = this.picture.layerFromPath(this.path)
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

export
class TransformLayerCommand implements UndoCommand {
  title = "Transform Layer"
  oldTiledTexture: TiledTexture|undefined
  selectionChangeCommand: SelectionChangeCommand|undefined

  constructor(public picture: Picture, public path: number[], public transform: Transform, public transformsSelection: boolean) {
  }

  undo() {
    if (this.selectionChangeCommand) {
      this.selectionChangeCommand.undo()
    }
    const layer = this.picture.layerFromPath(this.path)
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
    const layer = this.picture.layerFromPath(this.path)
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
