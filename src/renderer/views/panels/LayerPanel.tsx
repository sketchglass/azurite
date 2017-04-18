import {action} from 'mobx'
import {observer} from 'mobx-react'
import React = require('react')
import * as classNames from 'classnames'
import {TreeView, TreeDelegate, TreeRowInfo} from 'react-draggable-tree'
import 'react-draggable-tree/lib/index.css'
import IndexPath from '../../../lib/IndexPath'
import {AddLayerAction, GroupLayerAction, RemoveLayerAction} from '../../actions/LayerActions'
import {appState} from '../../app/AppState'
import {MoveLayerCommand, CopyLayerCommand, ChangeLayerPropsCommand} from '../../commands/LayerCommand'
import Layer, {GroupLayer} from '../../models/Layer'
import ClickToEdit from '../components/ClickToEdit'
import SVGIcon from '../components/SVGIcon'
import LayerDetail from '../LayerDetail'
import './LayerPanel.css'

const layerKeys = new WeakMap<Layer, number>()
let currentLayerKey = 0

class LayerTreeDelegate implements TreeDelegate<Layer> {
  getKey(layer: Layer) {
    if (!layerKeys.has(layer)) {
      layerKeys.set(layer, currentLayerKey++)
    }
    return layerKeys.get(layer)!
  }
  getChildren(layer: Layer) {
    if (layer instanceof GroupLayer) {
      return layer.children
    }
  }
  getCollapsed(layer: Layer) {
    if (layer instanceof GroupLayer) {
      return layer.collapsed
    } else {
      return false
    }
  }
  getDroppable(layer: Layer) {
    return true
  }

  renderRow(info: TreeRowInfo<Layer>) {
    return <LayerListItem layer={info.item} selected={info.selected} />
  }

  @action onSelectedKeysChange(selectedKeys: Set<number>, selectedNodeInfos: TreeRowInfo<Layer>[]) {
    const picture = appState.currentPicture
    if (picture) {
      picture.selectedLayers.replace(selectedNodeInfos.map(info => info.item))
    }
  }
  @action onCollapsedChange(info: TreeRowInfo<Layer>, collapsed: boolean) {
    const layer = info.item
    if (layer instanceof GroupLayer) {
      layer.collapsed = collapsed
    }
  }
  @action onContextMenu(info: TreeRowInfo<Layer>|undefined, ev: React.MouseEvent<HTMLElement>) {
    // TODO
  }
  @action onMove(src: TreeRowInfo<Layer>[], dest: TreeRowInfo<Layer>, destIndex: number) {
    const picture = appState.currentPicture
    if (picture) {
      const srcPaths = src.map(info => new IndexPath(info.path))
      const destPath = new IndexPath(dest.path).child(destIndex)
      const command = new MoveLayerCommand(picture, srcPaths, destPath)
      picture.undoStack.push(command)
    }
  }
  @action onCopy(src: TreeRowInfo<Layer>[], dest: TreeRowInfo<Layer>, destIndex: number) {
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
  }
}

const LayerListItem = observer((props: {layer: Layer, selected: boolean}) => {
  const {layer, selected} = props
  const {picture} = layer

  const rename = (name: string) => {
    if (layer.name !== name) {
      picture.undoStack.push(new ChangeLayerPropsCommand(picture, layer.path, 'Rename Layer', {name}))
    }
  }

  const thumbnail = appState.stateForPicture(picture)!.thumbnailManager.thumbnailForLayer(layer)

  const onVisibleToggle = (e: React.FormEvent<HTMLInputElement>) => {
    const visible = (e.target as HTMLInputElement).checked
    if (layer.visible !== visible) {
      picture.undoStack.push(new ChangeLayerPropsCommand(picture, layer.path, 'Change Layer Visibility', {visible}))
    }
  }
  const onVisibleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation()
  }
  const className = classNames('LayerPanel_layer', {'LayerPanel_layer-clipped': layer.clippingGroup})

  return (
    <div className={className}>
      <img src={thumbnail} />
      <ClickToEdit text={layer.name} onChange={rename} editable={selected}/>
      <input type="checkbox" checked={layer.visible} onChange={onVisibleToggle} onClick={onVisibleClick} />
    </div>
  )
})

@observer export default
class LayerPanel extends React.Component<{}, {}> {
  delegate = new LayerTreeDelegate()

  render() {
    const picture = appState.currentPicture
    let tree: JSX.Element|undefined
    if (picture) {
      const selectedKeys = picture.selectedLayers.map(layer => this.delegate.getKey(layer))
      const LayerTreeView = TreeView as new () => TreeView<Layer>
      tree = <LayerTreeView
        root={picture.rootLayer}
        selectedKeys={new Set(selectedKeys)}
        rowHeight={48}
        delegate={this.delegate}
      />
    }

    return (
      <div className="LayerPanel">
        <div className="LayerPanel_scroll">
          {tree}
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
