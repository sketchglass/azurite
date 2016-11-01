import * as React from "react"
import {reaction, observable, computed} from "mobx"
import {observer} from "mobx-react"
import {Vec2, Rect, Transform} from "paintvec"
import {TextureDrawTarget} from "paintgl"
import Layer from "../models/Layer"
import {Tile} from "../models/TiledTexture"
import {TileBlender} from "../models/LayerBlender"
import Waypoint from "../models/Waypoint"
import Tool from './Tool'
import {context} from "../GLContext"

@observer
class TransformLayerOverlayUI extends React.Component<{tool: TransformLayerTool}, {}> {
  render() {
    const {tool} = this.props
    const {boundingRect} = tool
    let polygon: JSX.Element|undefined = undefined
    if (boundingRect) {
      const {topLeft, topRight, bottomLeft, bottomRight} = boundingRect
      const points = [topLeft, topRight, bottomRight, bottomLeft]
        .map(v => v.transform(tool.renderer.transformFromPicture).divScalar(devicePixelRatio))
        .map(v => `${v.x},${v.y}`).join(" ")
      polygon = <polygon points={points} stroke="#888" fill="transparent" />
    }
    return (
      <g>
        {polygon}
      </g>
    )
  }
}

const tile = new Tile()
const drawTarget = new TextureDrawTarget(context, tile.texture)

export default
class TransformLayerTool extends Tool {
  name = "Move"

  @computed get currentContent() {
    const {active, currentLayer} = this
    if (active && currentLayer && currentLayer.content.type == "image") {
      return currentLayer.content
    }
  }

  @computed get boundingRect() {
    if (this.currentContent) {
      return this.currentContent.tiledTexture.boundingRect()
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

  hookLayerBlend(layer: Layer, tileKey: Vec2, tile: Tile|undefined, tileBlender: TileBlender) {
    const content = this.currentContent
    if (content && layer == content.layer) {
      return false // TODO
    } else {
      return false
    }
  }
}
