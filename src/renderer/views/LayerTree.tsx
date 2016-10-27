import {action, IObservableArray} from "mobx"
import {observer} from "mobx-react"
import React = require("react")
import {Tree, TreeNode, NodeInfo} from "react-draggable-tree"
import "react-draggable-tree/lib/index.css"
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import {ImageLayerContent} from "../models/LayerContent"
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
  render() {
    const {picture} = this.props
    const dummyRoot = {key: 0} as LayerTreeNode
    const root = picture ? layerToNode(picture.rootLayer) : dummyRoot
    const selectedKeys = picture ? picture.selectedLayers.map(getLayerKey) : []

    const onSelectedKeysChange = (selectedKeys: Set<number>, selectedNodeInfos: NodeInfo<LayerTreeNode>[]) => {
      if (picture) {
        picture.selectedLayers.replace(selectedNodeInfos.map(info => info.node.layer))
      }
    }
    const onCollapsedChange = (nodeInfo: NodeInfo<LayerTreeNode>, collapsed: boolean) => {
      const {layer} = nodeInfo.node
      if (layer.content.type == "group") {
        layer.content.collapsed = collapsed
      }
    }
    const onMove = (src: NodeInfo<LayerTreeNode>[], dest: NodeInfo<LayerTreeNode>, destIndex: number, destIndexAfter: number) => {
      if (picture) {
        const srcPaths = src.map(info => info.path)
        const destPath = [...dest.path, destIndexAfter]
        const command = new MoveLayerCommand(picture, srcPaths, destPath)
        picture.undoStack.redoAndPush(command)
      }
    }
    const onCopy = (src: NodeInfo<LayerTreeNode>[], dest: NodeInfo<LayerTreeNode>, destIndex: number) => {
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
    }

    return (
      <div className="LayerTree">
        <div className="LayerTree_buttons">
          <button onClick={this.addLayer.bind(this)}>Add</button>
          <button onClick={this.removeLayer.bind(this)}>Remove</button>
        </div>
        <LayerTreeView
          root={root}
          selectedKeys={new Set(selectedKeys)}
          rowHeight={72}
          rowContent={({node, selected}) => <LayerTreeItem layer={node.layer} selected={selected} />}
          onSelectedKeysChange={onSelectedKeysChange}
          onCollapsedChange={onCollapsedChange}
          onMove={onMove}
          onCopy={onCopy}
        />
      </div>
    )
  }

  addLayer() {
    const {picture} = this.props
    if (picture) {
      const path = picture.currentLayer ? picture.currentLayer.path() : [0]
      picture.undoStack.redoAndPush(new AddLayerCommand(picture, path))
    }
  }

  removeLayer() {
    const {picture} = this.props
    if (picture) {
      const paths = picture.selectedLayers.map(l => l.path())
      picture.undoStack.redoAndPush(new RemoveLayerCommand(picture, paths))
    }
  }
}

function getSiblingsAndIndex(picture: Picture, path: number[]): [IObservableArray<Layer>, number] {
  const parent = picture.layerForPath(path.slice(0, -1))
  if (!parent || parent.content.type != "group") {
    throw new Error("invalid path")
  }
  const index = path[path.length - 1]
  return [parent.content.children, index]
}

class MoveLayerCommand {
  constructor(public readonly picture: Picture, public readonly srcPaths: number[][], public readonly dstPath: number[]) {
  }

  undo() {
    const [dstSiblings, dstIndex] = getSiblingsAndIndex(this.picture, this.dstPath)
    const srcs = dstSiblings.splice(dstIndex, this.srcPaths.length)

    for (const [i, srcPath] of this.srcPaths.entries()) {
      const [srcSiblings, srcIndex] = getSiblingsAndIndex(this.picture, srcPath)
      srcSiblings.splice(srcIndex, 0, srcs[i])
    }
  }

  redo() {
    const srcs: Layer[] = []
    for (const srcPath of [...this.srcPaths].reverse()) {
      const [srcSiblings, srcIndex] = getSiblingsAndIndex(this.picture, srcPath)
      const src = srcSiblings.splice(srcIndex, 1)[0]
      srcs.unshift(src)
    }

    const [dstSiblings, dstIndex] = getSiblingsAndIndex(this.picture, this.dstPath)
    dstSiblings.splice(dstIndex, 0, ...srcs)
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

class AddLayerCommand {
  constructor(public readonly picture: Picture, public readonly path: number[]) {
  }

  undo() {
    const [siblings, index] = getSiblingsAndIndex(this.picture, this.path)
    const layer = siblings.splice(index, 1)[0]
    layer.dispose()
  }
  redo() {
    const [siblings, index] = getSiblingsAndIndex(this.picture, this.path)
    const layer = new Layer(this.picture, "Layer", layer => new ImageLayerContent(layer))
    siblings.splice(index, 0, layer)
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
