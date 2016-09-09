import React = require("react")
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import ClickToEdit from "./ClickToEdit"
const classNames = require("classnames")

interface LayerListProps {
  picture: Picture
}

export default
class LayerList extends React.Component<LayerListProps, void> {
  constructor(props: LayerListProps) {
    super(props)
    props.picture.changed.forEach(() => {
      this.forceUpdate()
    })
  }

  render() {
    const {picture} = this.props
    const elems = picture.layers.map((layer, i) => {
      const current = picture.currentLayerIndex == i
      const onClick = () => {
        picture.currentLayerIndex = i
        picture.changed.next()
      }
      const onRename = (name: string) => {
        layer.name = name
        picture.changed.next()
      }
      return (
        <div className={classNames("LayerList_layer", {"LayerList_layer-current": current})} key={i} onClick={onClick}>
          <ClickToEdit text={layer.name} onChange={onRename} />
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
