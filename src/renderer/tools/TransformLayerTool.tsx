import * as React from "react"
import {reaction, observable, computed} from "mobx"
import {observer} from "mobx-react"
import {Vec2, Rect, Transform} from "paintvec"
import Tool from './Tool'
import Waypoint from "../models/Waypoint"

@observer
class TransformLayerOverlayUI extends React.Component<{tool: TransformLayerTool}, {}> {
  render() {
    const {tool} = this.props
    const {boundingRect} = tool
    let polygon: JSX.Element|undefined = undefined
    if (boundingRect) {
      const points = boundingRect.vertices().map(v => `${v.x},${v.y}`).join(" ")
      polygon = <polygon points={points} />
    }
    return (
      <g>
        {polygon}
      </g>
    )
  }
}

export default
class TransformLayerTool extends Tool {
  name = "Move"

  @computed get boundingRect() {
    const {active, currentLayer} = this
    console.log(active, currentLayer)
    if (active && currentLayer && currentLayer.content.type == "image") {
      const rect = currentLayer.content.tiledTexture.boundingRect()
      console.log(rect)
      return rect
    }
  }

  start(waypoint: Waypoint, rendererPos: Vec2) {
  }

  move(waypoint: Waypoint, rendererPos: Vec2) {
  }

  end() {
  }

  renderOverlayUI() {
    return <TransformLayerOverlayUI tool={this} />
  }
}
