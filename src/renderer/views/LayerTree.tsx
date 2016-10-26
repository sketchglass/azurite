import {action} from "mobx"
import {observer} from "mobx-react"
import React = require("react")
import {Tree, TreeNode, NodeInfo} from "react-draggable-tree"
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
  if (content.type == "group") {
    children = content.children.map(layerToNode)
  } else {
    children = undefined
  }
  const key = getLayerKey(layer)
  const collapsed = false // TODO

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
    const selectedKeys = new Set<number>()

    const onSelectedKeysChange = (selectedKeys: Set<number>) => {
      // TODO
    }
    const onCollapsedChange = (nodeInfo: NodeInfo<LayerTreeNode>, collapsed: boolean) => {
      // TODO
    }
    const onMove = (src: NodeInfo<LayerTreeNode>[], dest: NodeInfo<LayerTreeNode>, destIndex: number, destIndexAfter: number) => {
      // TODO
    }
    const onCopy = (src: NodeInfo<LayerTreeNode>[], dest: NodeInfo<LayerTreeNode>, destIndex: number) => {
      // TODO
    }

    return (
      <div className="LayerTree">
        <div className="LayerTree_buttons">
          <button onClick={this.addLayer.bind(this)}>Add</button>
          <button onClick={this.removeLayer.bind(this)}>Remove</button>
        </div>
        <LayerTreeView
          root={root}
          selectedKeys={selectedKeys}
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

  @action selectLayer(i: number) {
    const {picture} = this.props
    if (picture) {
      picture.currentLayerIndex = i
    }
  }

  addLayer() {
    const {picture} = this.props
    if (picture) {
      picture.undoStack.redoAndPush(new AddLayerCommand(picture, picture.currentLayerIndex))
    }
  }

  removeLayer() {
    const {picture} = this.props
    if (picture) {
      if (picture.layers.length > 1) {
        picture.undoStack.redoAndPush(new RemoveLayerCommand(picture, picture.currentLayerIndex))
      }
    }
  }
}

class MoveLayerCommand {
  constructor(public picture: Picture, public from: number, public to: number) {
  }
  move(from: number, to: number) {
    const {picture} = this
    const layer = picture.layers[from]
    picture.layers.splice(from, 1)
    picture.layers.splice(to, 0, layer)
    picture.currentLayerIndex = to
  }
  undo() {
    this.move(this.to, this.from)
  }
  redo() {
    this.move(this.from, this.to)
  }
}

class AddLayerCommand {
  layer = new Layer(this.picture, "Layer", new ImageLayerContent(this.picture))
  constructor(public picture: Picture, public index: number) {
  }
  undo() {
    const {picture} = this
    picture.layers.splice(this.index, 1)
    picture.currentLayerIndex = Math.min(picture.currentLayerIndex, picture.layers.length - 1)
  }
  redo() {
    const {picture} = this
    picture.layers.splice(this.index, 0, this.layer)
  }
}

class RemoveLayerCommand {
  removedLayer: Layer
  constructor(public picture: Picture, public index: number) {
  }
  undo() {
    const {picture} = this
    picture.layers.splice(this.index, 0, this.removedLayer)
  }
  redo() {
    const {picture} = this
    this.removedLayer = picture.layers.splice(this.index, 1)[0]
    picture.currentLayerIndex = Math.min(picture.currentLayerIndex, picture.layers.length - 1)
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
