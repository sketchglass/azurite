import {action} from "mobx"
import {observer} from "mobx-react"
import React = require("react")
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import ClickToEdit from "./ClickToEdit"
const classNames = require("classnames")
import {mouseOffsetPos} from "./util"
import "../../styles/LayerList.sass"

interface LayerListProps {
  picture: Picture|undefined
}

const CELL_HEIGHT = 72
const LAYER_DRAG_MIME = "x-azurite-layer-drag"

const LayerListItem = observer((props: {layer: Layer, current: boolean, index: number}) => {
  const {layer, current, index} = props
  const select = () => {
    const {picture} = layer
    picture.currentLayerIndex = index
  }

  const rename = (name: string) => {
    const {picture} = layer
    if (layer.name != name) {
      picture.undoStack.redoAndPush(new RenameLayerCommand(layer, name))
    }
  }

  const onDragStart = (ev: React.DragEvent<HTMLElement>) => {
    ev.dataTransfer.setData(LAYER_DRAG_MIME, index.toString())
  }
  return (
    <div className={classNames("LayerList_layer", {"LayerList_layer-current": current})} onClick={select} draggable={true} onDragStart={onDragStart}>
      <img src={layer.thumbnail} />
      <ClickToEdit text={layer.name} onChange={rename} editable={current} />
    </div>
  )
})

@observer export default
class LayerList extends React.Component<LayerListProps, {}> {
  render() {
    const {picture} = this.props
    let layers: Layer[] = picture ? picture.layers : []
    let currentLayerIndex = picture ? picture.currentLayerIndex : 0
    return (
      <div className="LayerList" onDragOver={this.onDragOver.bind(this)} onDrop={this.onDrop.bind(this)}>
        <div className="LayerList_buttons">
          <button onClick={this.addLayer.bind(this)}>Add</button>
          <button onClick={this.removeLayer.bind(this)}>Remove</button>
        </div>
        <div ref="scroll" className="LayerList_scroll">
          {layers.map((layer, i) => <LayerListItem key={i} layer={layer} index={i} current={currentLayerIndex == i} />)}
        </div>
      </div>
    )
  }

  onDragOver(ev: React.DragEvent<HTMLElement>) {
    ev.preventDefault()
  }
  onDrop(ev: React.DragEvent<HTMLElement>) {
    const data = ev.dataTransfer.getData(LAYER_DRAG_MIME)
    if (data == "") {
      return
    }
    ev.preventDefault()
    const {picture} = this.props
    if (!picture) {
      return
    }
    const from = parseInt(data)
    const {y} = mouseOffsetPos(ev, this.refs["scroll"] as HTMLElement)
    let to = Math.min(Math.floor((y + CELL_HEIGHT / 2) / CELL_HEIGHT), picture.layers.length)
    if (from < to) {
      to -= 1
    }
    const command = new MoveLayerCommand(picture, from, to)
    picture.undoStack.redoAndPush(command)
  }

  @action selectLayer(i: number) {
    const {picture} = this.props
    if (!picture) {
      return
    }
    picture.currentLayerIndex = i
  }

  addLayer() {
    const {picture} = this.props
    if (!picture) {
      return
    }
    picture.undoStack.redoAndPush(new AddLayerCommand(picture, picture.currentLayerIndex))
  }

  removeLayer() {
    const {picture} = this.props
    if (!picture) {
      return
    }
    if (picture.layers.length > 1) {
      picture.undoStack.redoAndPush(new RemoveLayerCommand(picture, picture.currentLayerIndex))
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
  layer = new Layer(this.picture, this.picture.size)
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
