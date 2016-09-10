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
  current: number
}

function pictureToState(picture: Picture) {
  return {
    layers: picture.layers,
    current: picture.currentLayerIndex,
  }
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
    const {layers, current} = this.state
    const {picture} = this.props
    const elems = layers.map((layer, i) => {
      const onClick = () => { this.selectLayer(i) }
      const onRename = (name: string) => { this.renameLayer(i, name) }
      return (
        <div className={classNames("LayerList_layer", {"LayerList_layer-current": current == i})} key={i} onClick={onClick}>
          <ClickToEdit text={layer.name} onChange={onRename} editable={current == i} />
        </div>
      )
    })
    return (
      <div className="LayerList">
        <button onClick={this.addLayer.bind(this)}>Add</button>
        <button onClick={this.removeLayer.bind(this)}>Remove</button>
        {elems}
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
