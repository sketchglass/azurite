import React = require("react")
import Picture from "../models/Picture"
import Layer from "../models/Layer"
const classNames = require("classnames")

interface LayerListProps {
  picture: Picture
}

export default
class LayerList extends React.Component<LayerListProps, void> {
  constructor(props: LayerListProps) {
    super(props)
    props.picture.layersChanged.forEach(() => {
      this.forceUpdate()
    })
    props.picture.currentLayerChanged.forEach(() => {
      this.forceUpdate()
    })
  }

  render() {
    const {picture} = this.props
    const elems = picture.layers.map((layer, i) => {
      const current = picture.currentLayerIndex == i
      const onClick = () => {
        picture.currentLayerIndex = i
        picture.currentLayerChanged.next()
      }
      return (
        <div className={classNames("LayerList_layer", {"LayerList_layer-current": current})} key={i} onClick={onClick}>
          {layer.name}
        </div>
      )
    })
    return (
      <div className="LayerList">
        <button onClick={this.addLayer.bind(this)}>Add</button>
        {elems}
      </div>
    )
  }

  addLayer() {
    const {picture} = this.props
    picture.layers.push(new Layer(picture.size))
    picture.layersChanged.next()
  }
}
