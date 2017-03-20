import {action} from "mobx"
import {observer} from "mobx-react"
import React = require("react")
import * as classNames from "classnames"
import {Tree, TreeNode, NodeInfo} from "react-draggable-tree"
import "react-draggable-tree/lib/index.css"
import Layer, {GroupLayer} from "../../models/Layer"
import {MoveLayerCommand, CopyLayerCommand, ChangeLayerPropsCommand} from "../../commands/LayerCommand"
import ClickToEdit from "../components/ClickToEdit"
import SVGIcon from "../components/SVGIcon"
import LayerDetail from "../LayerDetail"
import {appState} from "../../app/AppState"
import IndexPath from "../../../lib/IndexPath"
import {AddLayerAction, GroupLayerAction, RemoveLayerAction} from "../../actions/LayerActions"
import "./LayerPanel.css"

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
  let children: LayerNode[] | undefined
  let collapsed = false
  if (layer instanceof GroupLayer) {
    children = layer.children.map(layerToNode)
    collapsed = layer.collapsed
  } else {
    children = undefined
  }
  const key = getLayerKey(layer)

  return {key, children, collapsed, layer}
}

const LayerListItem = observer((props: {layer: Layer, selected: boolean}) => {
  const {layer, selected} = props
  const {picture} = layer

  const rename = (name: string) => {
    if (layer.name != name) {
      picture.undoStack.push(new ChangeLayerPropsCommand(picture, layer.path, "Rename Layer", {name}))
    }
  }

  const thumbnail = appState.stateForPicture(picture)!.thumbnailManager.thumbnailForLayer(layer)

  const onVisibleToggle = (e: React.FormEvent<HTMLInputElement>) => {
    const visible = (e.target as HTMLInputElement).checked
    if (layer.visible != visible) {
      picture.undoStack.push(new ChangeLayerPropsCommand(picture, layer.path, "Change Layer Visibility", {visible}))
    }
  }
  const onVisibleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation()
  }
  const className = classNames("LayerPanel_layer", {"LayerPanel_layer-clipped": layer.clippingGroup})

  return (
    <div className={className}>
      <img src={thumbnail} />
      <ClickToEdit text={layer.name} onChange={rename} editable={selected}/>
      <input type="checkbox" checked={layer.visible} onChange={onVisibleToggle} onClick={onVisibleClick} />
    </div>
  )
})

class LayerTree extends Tree<LayerNode> {
}

@observer export default
class LayerPanel extends React.Component<{}, {}> {

  onSelectedKeysChange = action((selectedKeys: Set<number>, selectedNodeInfos: NodeInfo<LayerNode>[]) => {
    const picture = appState.currentPicture
    if (picture) {
      picture.selectedLayers.replace(selectedNodeInfos.map(info => info.node.layer))
    }
  })
  onCollapsedChange = action((nodeInfo: NodeInfo<LayerNode>, collapsed: boolean) => {
    const {layer} = nodeInfo.node
    if (layer instanceof GroupLayer) {
      layer.collapsed = collapsed
    }
  })
  onMove = action((src: NodeInfo<LayerNode>[], dest: NodeInfo<LayerNode>, destIndex: number) => {
    const picture = appState.currentPicture
    if (picture) {
      const srcPaths = src.map(info => new IndexPath(info.path))
      const destPath = new IndexPath(dest.path).child(destIndex)
      const command = new MoveLayerCommand(picture, srcPaths, destPath)
      picture.undoStack.push(command)
    }
  })
  onCopy = action((src: NodeInfo<LayerNode>[], dest: NodeInfo<LayerNode>, destIndex: number) => {
    const picture = appState.currentPicture
    if (picture) {
      const srcPaths = src.map(info => new IndexPath(info.path))
      const destPath = new IndexPath(dest.path).child(destIndex)
      const command = new CopyLayerCommand(picture, srcPaths, destPath)
      picture.undoStack.push(command)
      const copiedLayers: Layer[] = []
      for (let i = 0; i < srcPaths.length; ++i) {
        const path = new IndexPath(dest.path).child(destIndex + i)
        const layer = picture.layerForPath(path)!
        copiedLayers.push(layer)
      }
      picture.selectedLayers.replace(copiedLayers)
    }
  })

  render() {
    const picture = appState.currentPicture
    const dummyRoot = {key: 0} as LayerNode
    const root = picture ? layerToNode(picture.rootLayer) : dummyRoot
    const selectedKeys = picture ? picture.selectedLayers.map(getLayerKey) : []

    return (
      <div className="LayerPanel">
        <div className="LayerPanel_scroll">
          <LayerTree
            root={root}
            selectedKeys={new Set(selectedKeys)}
            rowHeight={48}
            rowContent={({node, selected}) => <LayerListItem layer={node.layer} selected={selected} />}
            onSelectedKeysChange={this.onSelectedKeysChange}
            onCollapsedChange={this.onCollapsedChange}
            onMove={this.onMove}
            onCopy={this.onCopy}
          />
        </div>
        <div className="LayerPanel_buttons">
          <button onClick={this.addLayer.bind(this)}><SVGIcon className="add" /></button>
          <button onClick={this.groupLayer.bind(this)}><SVGIcon className="folder" /></button>
          <button onClick={this.removeLayer.bind(this)}><SVGIcon className="subtract" /></button>
        </div>
        <LayerDetail layer={picture && picture.currentLayer} />
      </div>
    )
  }

  @action groupLayer() {
    new GroupLayerAction().run()
  }

  @action addLayer() {
    new AddLayerAction().run()
  }

  @action removeLayer() {
    new RemoveLayerAction().run()
  }
}
