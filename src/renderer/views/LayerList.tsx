import React = require("react")
import Picture from "../models/Picture"

interface LayerListProps {
  picture: Picture
}

export default
class LayerList extends React.Component<LayerListProps, void> {
  constructor(props: LayerListProps) {
    super(props)
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
        {elems}
      </div>
    )
  }
}
