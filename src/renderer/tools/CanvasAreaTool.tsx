import * as React from "react"
import {reaction} from "mobx"
import {Vec2, Rect} from "paintvec"
import RectMoveTool from "./RectMoveTool"
import {ToolPointerEvent} from "./Tool"
import FrameDebounced from "../views/components/FrameDebounced"
import {AppState} from "../state/AppState"

const HANDLE_RADIUS = 4

class CanvasAreaOverlayUI extends FrameDebounced<{tool: CanvasAreaTool}, {}> {
  renderDebounced() {
    const {tool} = this.props
    const {rect} = tool

    if (!tool.hasRect) {
      return <g />
    }

    const transformPos = (pos: Vec2) => {
      return pos.transform(tool.renderer.transformFromPicture).divScalar(devicePixelRatio)
    }

    const vertices = rect.vertices().map(transformPos)

    const polygonPoints = vertices.map(v => `${v.x},${v.y}`).join(" ")
    const [topLeft, topRight, bottomRight, bottomLeft] = vertices
    const handlePositions = [
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
      topLeft.add(topRight).divScalar(2),
      topRight.add(bottomRight).divScalar(2),
      bottomRight.add(bottomLeft).divScalar(2),
      bottomLeft.add(topLeft).divScalar(2),
    ]
    return (
      <g>
        <polygon points={polygonPoints} stroke="#888" fill="transparent" />
        {handlePositions.map((pos, i) => <circle key={i} cx={pos.x} cy={pos.y} r={HANDLE_RADIUS} stroke="#888" fill="#FFF" />)}
      </g>
    )
  }
}

export default
class CanvasAreaTool extends RectMoveTool {
  name = "Canvas Area"
  handleRadius = HANDLE_RADIUS

  constructor(appState: AppState) {
    super(appState)
    reaction(() => this.active, () => {
      if (this.active && this.picture) {
        this.resetRect(new Rect(new Vec2(), this.picture.size))
      }
    })
  }

  renderOverlayUI() {
    return <CanvasAreaOverlayUI tool={this} />
  }
}
