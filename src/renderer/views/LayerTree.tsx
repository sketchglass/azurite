import {action, IObservableArray} from "mobx"
import {observer} from "mobx-react"
import React = require("react")
import {Tree, TreeNode, NodeInfo} from "react-draggable-tree"
import "react-draggable-tree/lib/index.css"
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import {ImageLayerContent, GroupLayerContent} from "../models/LayerContent"
import ClickToEdit from "./components/ClickToEdit"
const classNames = require("classnames")
import {mouseOffsetPos} from "./util"

interface LayerTreeProps {
  picture: Picture|undefined
}

interface LayerTreeNode extends TreeNode {
  layer: Layer
}

const layerKeys = new WeakMap<Layer, number>()
let currentLayerKey = 0

function getLayerKey(layer: Layer) {
  if (!layerKeys.has(layer)) {
    layerKeys.set(layer, currentLayerKey++)
  }
  return layerKeys.get(layer)!
}

function layerToNode(layer: Layer): LayerTreeNode {
  const {content} = layer
  let children: LayerTreeNode[] | undefined
  let collapsed = false
  if (content.type == "group") {
    children = content.children.map(layerToNode)
    collapsed = content.collapsed
  } else {
    children = undefined
  }
  const key = getLayerKey(layer)

  return {key, children, collapsed, layer}
}

const LayerTreeItem = observer((props: {layer: Layer, selected: boolean}) => {
  const {layer, selected} = props

  const rename = (name: string) => {
    const {picture} = layer
    if (layer.name != name) {
      picture.undoStack.redoAndPush(new RenameLayerCommand(layer, name))
    }
  }

  const {content} = layer
  const thumbnail = (content.type == "image") ? content.thumbnail : ""

  return (
    <div className="LayerTree_layer">
      <img src={thumbnail} />
      <ClickToEdit text={layer.name} onChange={rename} editable={selected}/>
    </div>
  )
})

class LayerTreeView extends Tree<LayerTreeNode> {
}

@observer export default
class LayerTree extends React.Component<LayerTreeProps, {}> {

  onSelectedKeysChange = action((selectedKeys: Set<number>, selectedNodeInfos: NodeInfo<LayerTreeNode>[]) => {
    const {picture} = this.props
    if (picture) {
      picture.selectedLayers.replace(selectedNodeInfos.map(info => info.node.layer))
    }
  })
  onCollapsedChange = action((nodeInfo: NodeInfo<LayerTreeNode>, collapsed: boolean) => {
    const {layer} = nodeInfo.node
    if (layer.content.type == "group") {
      layer.content.collapsed = collapsed
    }
  })
  onMove = action((src: NodeInfo<LayerTreeNode>[], dest: NodeInfo<LayerTreeNode>, destIndex: number) => {
    const {picture} = this.props
    if (picture) {
      const srcPaths = src.map(info => info.path)
      const destPath = [...dest.path, destIndex]
      const command = new MoveLayerCommand(picture, srcPaths, destPath)
      picture.undoStack.redoAndPush(command)
    }
  })
  onCopy = action((src: NodeInfo<LayerTreeNode>[], dest: NodeInfo<LayerTreeNode>, destIndex: number) => {
    const {picture} = this.props
    if (picture) {
      const srcPaths = src.map(info => info.path)
      const destPath = [...dest.path, destIndex]
      const command = new CopyLayerCommand(picture, srcPaths, destPath)
      picture.undoStack.redoAndPush(command)
      const copiedLayers: Layer[] = []
      for (let i = 0; i < srcPaths.length; ++i) {
        const path = [...dest.path, destIndex + i]
        const layer = picture.layerFromPath(path)!
        copiedLayers.push(layer)
      }
      picture.selectedLayers.replace(copiedLayers)
    }
  })

  render() {
    const {picture} = this.props
    const dummyRoot = {key: 0} as LayerTreeNode
    const root = picture ? layerToNode(picture.rootLayer) : dummyRoot
    const selectedKeys = picture ? picture.selectedLayers.map(getLayerKey) : []

    return (
      <div className="LayerTree">
        <div className="LayerTree_buttons">
          <button onClick={this.addLayer.bind(this)}>Add</button>
          <button onClick={this.groupLayer.bind(this)}>Group</button>
          <button onClick={this.removeLayer.bind(this)}>Remove</button>
        </div>
        <LayerTreeView
          root={root}
          selectedKeys={new Set(selectedKeys)}
          rowHeight={72}
          rowContent={({node, selected}) => <LayerTreeItem layer={node.layer} selected={selected} />}
          onSelectedKeysChange={this.onSelectedKeysChange}
          onCollapsedChange={this.onCollapsedChange}
          onMove={this.onMove}
          onCopy={this.onCopy}
        />
      </div>
    )
  }

  @action groupLayer() {
    const {picture} = this.props
    if (picture) {
      if (picture.selectedLayers.length > 0) {
        const paths = picture.selectedLayers.map(l => l.path())
        picture.undoStack.redoAndPush(new GroupLayerCommand(picture, paths))
      }
    }
  }

  @action addLayer() {
    const {picture} = this.props
    if (picture) {
      const path = picture.currentLayer ? picture.currentLayer.path() : [0]
      picture.undoStack.redoAndPush(new AddLayerCommand(picture, path))
    }
  }

  @action removeLayer() {
    const {picture} = this.props
    if (picture) {
      const paths = picture.selectedLayers.map(l => l.path())
      picture.undoStack.redoAndPush(new RemoveLayerCommand(picture, paths))
    }
  }
}

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
  }
}

class RenameLayerCommand {
  oldName = this.layer.name
  constructor(public layer: Layer, public name: string) {
  }
  undo() {
    this.layer.name = this.oldName
  }
  redo() {
    this.layer.name = this.name
  }
}
