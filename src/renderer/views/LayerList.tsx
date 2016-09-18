import React = require("react")
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import ClickToEdit from "./ClickToEdit"
const classNames = require("classnames")
import {mouseOffsetPos} from "./util"

interface LayerListProps {
  picture: Picture
}

interface LayerListState {
  layers: Layer[]
  currentIndex: number
}

function pictureToState(picture: Picture) {
  return {
    layers: picture.layers,
    currentIndex: picture.currentLayerIndex,
  }
}

const CELL_HEIGHT = 72
const LAYER_DRAG_MIME = "x-azurite-layer-drag"

function LayerListItem(props: {layer: Layer, current: boolean, index: number}) {
  const {layer, current, index} = props
  const select = () => {
    const {picture} = layer
    picture.currentLayerIndex = index
    picture.changed.next()
  }

  const rename = (name: string) => {
    const {picture} = layer
    picture.layers[index].name = name
    picture.changed.next()
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
}

export default
class LayerList extends React.Component<LayerListProps, LayerListState> {
  state = pictureToState(this.props.picture)

  constructor(props: LayerListProps) {
    super(props)
    props.picture.changed.forEach(() => {
      this.setState(pictureToState(this.props.picture))
    })
  }

  render() {
    const {layers, currentIndex} = this.state
    const {picture} = this.props
    return (
      <div className="LayerList" onDragOver={this.onDragOver.bind(this)} onDrop={this.onDrop.bind(this)}>
        <div className="LayerList_buttons">
          <button onClick={this.addLayer.bind(this)}>Add</button>
          <button onClick={this.removeLayer.bind(this)}>Remove</button>
        </div>
        <div ref="scroll" className="LayerList_scroll">
          {layers.map((layer, i) => <LayerListItem key={i} layer={layer} index={i} current={currentIndex == i} />)}
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
    const from = parseInt(data)
    const {y} = mouseOffsetPos(ev, this.refs["scroll"] as HTMLElement)
    let to = Math.min(Math.floor((y + CELL_HEIGHT / 2) / CELL_HEIGHT), picture.layers.length)
    if (from < to) {
      to -= 1
    }
    const command = new MoveLayerCommand(picture, from, to)
    picture.undoStack.redoAndPush(command)
  }

  selectLayer(i: number) {
    const {picture} = this.props
    picture.currentLayerIndex = i
    picture.changed.next()
  }

  renameLayer(i: number, name: string) {
    const {picture} = this.props
    picture.layers[i].name = name
    picture.changed.next()
  }

  addLayer() {
    const {picture} = this.props
    picture.undoStack.redoAndPush(new AddLayerCommand(picture, picture.currentLayerIndex))
  }

  removeLayer() {
    const {picture} = this.props
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
    picture.changed.next()
  }
  undo() {
    this.move(this.to, this.from)
  }
  redo() {
    this.move(this.from, this.to)
  }
}

class AddLayerCommand {
  constructor(public picture: Picture, public index: number) {
  }
  undo() {
    const {picture} = this
    picture.layers.splice(this.index, 1)
    picture.currentLayerIndex = Math.min(picture.currentLayerIndex, picture.layers.length - 1)
    picture.changed.next()
  }
  redo() {
    const {picture} = this
    picture.layers.splice(this.index, 0, new Layer(picture, picture.size))
    picture.changed.next()
  }
}

class RemoveLayerCommand {
  removedLayer: Layer
  constructor(public picture: Picture, public index: number) {
  }
  undo() {
    const {picture} = this
    picture.layers.splice(this.index, 0, this.removedLayer)
    picture.changed.next()
  }
  redo() {
    const {picture} = this
    this.removedLayer = picture.layers.splice(this.index, 1)[0]
    picture.currentLayerIndex = Math.min(picture.currentLayerIndex, picture.layers.length - 1)
    picture.changed.next()
  }
}
