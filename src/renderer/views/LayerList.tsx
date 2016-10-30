import {action} from "mobx"
import {observer} from "mobx-react"
import React = require("react")
import {Tree, TreeNode, NodeInfo} from "react-draggable-tree"
import "react-draggable-tree/lib/index.css"
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import {MoveLayerCommand, CopyLayerCommand, GroupLayerCommand, AddLayerCommand, RemoveLayerCommand, ChangeLayerPropsCommand} from "../commands/LayerCommand"
import ClickToEdit from "./components/ClickToEdit"
import LayerDetail from "./LayerDetail"
const classNames = require("classnames")
import {mouseOffsetPos} from "./util"

interface LayerListProps {
  picture: Picture|undefined
}

interface LayerNode extends TreeNode {
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

function layerToNode(layer: Layer): LayerNode {
  const {content} = layer
  let children: LayerNode[] | undefined
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

const LayerListItem = observer((props: {layer: Layer, selected: boolean}) => {
  const {layer, selected} = props

  const rename = (name: string) => {
    const {picture} = layer
    if (layer.name != name) {
      picture.undoStack.redoAndPush(new ChangeLayerPropsCommand(layer, {name}))
    }
  }

  const {content} = layer
  const thumbnail = (content.type == "image") ? content.thumbnail : ""

  const onVisibleToggle = (e: React.FormEvent<HTMLInputElement>) => {
    layer.visible = e.target.checked
  }
  const onVisibleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation()
  }

  return (
    <div className="LayerList_layer">
      <img src={thumbnail} />
      <ClickToEdit text={layer.name} onChange={rename} editable={selected}/>
      <input type="checkbox" checked={layer.visible} onChange={onVisibleToggle} onClick={onVisibleClick} />
    </div>
  )
})

class LayerTree extends Tree<LayerNode> {
}

@observer export default
class LayerList extends React.Component<LayerListProps, {}> {

  onSelectedKeysChange = action((selectedKeys: Set<number>, selectedNodeInfos: NodeInfo<LayerNode>[]) => {
    const {picture} = this.props
    if (picture) {
      picture.selectedLayers.replace(selectedNodeInfos.map(info => info.node.layer))
    }
  })
  onCollapsedChange = action((nodeInfo: NodeInfo<LayerNode>, collapsed: boolean) => {
    const {layer} = nodeInfo.node
    if (layer.content.type == "group") {
      layer.content.collapsed = collapsed
    }
  })
  onMove = action((src: NodeInfo<LayerNode>[], dest: NodeInfo<LayerNode>, destIndex: number) => {
    const {picture} = this.props
    if (picture) {
      const srcPaths = src.map(info => info.path)
      const destPath = [...dest.path, destIndex]
      const command = new MoveLayerCommand(picture, srcPaths, destPath)
      picture.undoStack.redoAndPush(command)
    }
  })
  onCopy = action((src: NodeInfo<LayerNode>[], dest: NodeInfo<LayerNode>, destIndex: number) => {
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
    const dummyRoot = {key: 0} as LayerNode
    const root = picture ? layerToNode(picture.rootLayer) : dummyRoot
    const selectedKeys = picture ? picture.selectedLayers.map(getLayerKey) : []

    return (
      <div className="LayerList">
        <div className="LayerList_buttons">
          <button onClick={this.addLayer.bind(this)}>Add</button>
          <button onClick={this.groupLayer.bind(this)}>Group</button>
          <button onClick={this.removeLayer.bind(this)}>Remove</button>
        </div>
        <LayerTree
          root={root}
          selectedKeys={new Set(selectedKeys)}
          rowHeight={72}
          rowContent={({node, selected}) => <LayerListItem layer={node.layer} selected={selected} />}
          onSelectedKeysChange={this.onSelectedKeysChange}
          onCollapsedChange={this.onCollapsedChange}
          onMove={this.onMove}
          onCopy={this.onCopy}
        />
        <LayerDetail layer={picture && picture.currentLayer} />
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
