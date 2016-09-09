import React = require("react")
import Picture from "../models/Picture"
import Layer from "../models/Layer"

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
  }

  render() {
    const {picture} = this.props
    const elems = picture.layers.map((layer, i) => {
      return (
        <div className="LayerList_layer" key={i}>
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
