import * as React from "react"
import {reaction} from "mobx"
import {Vec2, Rect} from "paintvec"
import RectMoveTool from "./RectMoveTool"
import {ToolPointerEvent} from "./Tool"
import FrameDebounced from "../views/components/FrameDebounced"
import {AppState} from "../state/AppState"

const HANDLE_RADIUS = 4

function quadPath([a, b, c, d]: Vec2[]) {
  return `M ${a.x},${a.y} L ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y} Z`
}

class CanvasAreaOverlayUI extends FrameDebounced<{tool: CanvasAreaTool}, {}> {
  renderDebounced() {
    const {tool} = this.props
    const rect = tool.rect.translate(tool.translation)

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
    const rendererQuad = new Rect(new Vec2(), tool.renderer.size.divScalar(devicePixelRatio)).vertices()
    const fillPath = quadPath(rendererQuad) + " " + quadPath(vertices)

    return (
      <g>
        <path d={fillPath} fill="rgba(0,0,0,0.5)" fillRule="evenodd" />
        {handlePositions.map((pos, i) => <circle key={i} cx={pos.x} cy={pos.y} r={HANDLE_RADIUS} stroke="#888" fill="#FFF" />)}
      </g>
    )
  }
}

export default
class CanvasAreaTool extends RectMoveTool {
  name = "Canvas Area"
  handleRadius = HANDLE_RADIUS
  canRotate = false
  canDistort = false

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
