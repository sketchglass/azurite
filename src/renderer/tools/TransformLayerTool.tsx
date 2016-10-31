import * as React from "react"
import {observer} from "mobx-react"
import {Vec2, Transform} from "paintvec"
import Tool from './Tool'
import Waypoint from "../models/Waypoint"

@observer
class TransformLayerOverlayUI extends React.Component<{tool: TransformLayerTool}, {}> {
  render() {
    const {tool} = this.props
    return (
      <g>
      </g>
    )
  }
}

export default
class TransformLayerTool extends Tool {
  name = "Move"

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
