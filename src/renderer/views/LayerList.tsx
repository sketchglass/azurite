import React = require("react")
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import ClickToEdit from "./ClickToEdit"
const classNames = require("classnames")

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
  return (
    <div className={classNames("LayerList_layer", {"LayerList_layer-current": current})} onClick={select}>
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
      <div className="LayerList">
        <button onClick={this.addLayer.bind(this)}>Add</button>
        <button onClick={this.removeLayer.bind(this)}>Remove</button>
        {layers.map((layer, i) => <LayerListItem key={i} layer={layer} index={i} current={currentIndex == i} />)}
      </div>
    )
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
    picture.addLayer()
    picture.changed.next()
  }

  removeLayer() {
    const {picture} = this.props
    picture.removeLayer()
    picture.changed.next()
  }
}
