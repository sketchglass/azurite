import {Rect, Transform} from "paintvec"
import {Texture} from "paintgl"
import {IObservableArray} from "mobx"
import Picture from "../models/Picture"
import Layer, {LayerBlendMode} from "../models/Layer"
import {ImageLayerContent, GroupLayerContent} from "../models/LayerContent"
import TiledTexture from "../models/TiledTexture"
import {context} from "../GLContext"

function getSiblingsAndIndex(picture: Picture, path: number[]): [IObservableArray<Layer>, number] {
  const parent = picture.layerFromPath(path.slice(0, -1))
  if (!parent || parent.content.type != "group") {
    throw new Error("invalid path")
  }
  const index = path[path.length - 1]
  return [parent.content.children, index]
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
class MoveLayerCommand {
  dstPathAfter = dstPathAfterMove(this.srcPaths, this.dstPath)

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
class CopyLayerCommand {
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
class GroupLayerCommand {
  constructor(public readonly picture: Picture, public readonly srcPaths: number[][]) {
  }

  undo() {
    const [dstSiblings, dstIndex] = getSiblingsAndIndex(this.picture, this.srcPaths[0])
    const group = dstSiblings.splice(dstIndex, 1)[0]
    if (group.content.type != "group") {
      return
    }
    const {children} = group.content
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
    const group = new Layer(this.picture, "Group", layer => new GroupLayerContent(layer, srcs))

    const [dstSiblings, dstIndex] = getSiblingsAndIndex(this.picture, this.srcPaths[0])
    dstSiblings.splice(dstIndex, 0, group)
    this.picture.selectedLayers.replace([group])
  }
}

export
class AddLayerCommand {
  constructor(public readonly picture: Picture, public readonly path: number[]) {
  }

  undo() {
    const [siblings, index] = getSiblingsAndIndex(this.picture, this.path)
    const layer = siblings.splice(index, 1)[0]
    layer.dispose()
    const nextLayer = this.picture.layerFromPath(this.path)
    if (nextLayer) {
      this.picture.selectedLayers.replace([nextLayer])
    }
  }
  redo() {
    const [siblings, index] = getSiblingsAndIndex(this.picture, this.path)
    const layer = new Layer(this.picture, "Layer", layer => new ImageLayerContent(layer))
    siblings.splice(index, 0, layer)
    this.picture.selectedLayers.replace([layer])
  }
}

export
class RemoveLayerCommand {
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

    const nextLayer = this.picture.layerFromPath(this.paths[0])
    if (nextLayer) {
      this.picture.selectedLayers.replace([nextLayer])
    }
  }
}

export
interface LayerProps {
  name?: string
  visible?: boolean
  blendMode?: LayerBlendMode
  opacity?: number
}

export
class ChangeLayerPropsCommand {
  oldProps: LayerProps

  constructor(public picture: Picture, public path: number[], public props: LayerProps) {
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
      const {name, visible, blendMode, opacity} = layer
      this.oldProps = {name, visible, blendMode, opacity}
      Object.assign(layer, this.props)
    }
  }
}

export
class ChangeLayerImageCommand {
  constructor(public picture: Picture, public path: number[], public rect: Rect, public oldData: Uint16Array, public newData: Uint16Array) {
  }

  replace(data: Uint16Array) {
    const layer = this.picture.layerFromPath(this.path)
    if (!layer) {
      return
    }
    const {content} = layer
    if (content.type != "image") {
      return
    }

    const {rect} = this
    const texture = new Texture(context, {
      size: rect.size,
      pixelType: "half-float",
      data
    })
    content.tiledTexture.drawTexture(texture, {offset: rect.topLeft, blendMode: "src"})
    texture.dispose()
    content.layer.picture.lastUpdate = {rect, layer}
    content.updateThumbnail()
  }

  undo() {
    this.replace(this.oldData)
  }
  redo() {
    this.replace(this.newData)
  }
}

export
class TransformLayerCommand {
  constructor(public picture: Picture, public path: number[], public originalTiledTexture: TiledTexture, public oldTransform: Transform, public newTransform: Transform) {
  }

  get content() {
    const layer = this.picture.layerFromPath(this.path)
    if (!layer) {
      return
    }
    const {content} = layer
    if (content.type != "image") {
      return
    }
    return content
  }

  undo() {
    this.replace(this.originalTiledTexture, this.oldTransform)
  }

  redo() {
    this.replace(this.originalTiledTexture, this.newTransform)
  }

  replace(tiledTexture: TiledTexture, transform: Transform) {
    const {content} = this
    if (!content) {
      return
    }
    const old = content.tiledTexture
    content.tiledTexture = tiledTexture.transform(transform)
    old.dispose()
    this.picture.lastUpdate = {layer: content.layer}
  }
}
