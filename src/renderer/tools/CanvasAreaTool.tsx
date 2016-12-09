import * as React from "react"
import {reaction, action} from "mobx"
import {observer} from "mobx-react"
import {Vec2, Rect} from "paintvec"
import RectMoveTool, {DragType} from "./RectMoveTool"
import {ToolPointerEvent} from "./Tool"
import FrameDebounced from "../views/components/FrameDebounced"
import {AppState} from "../state/AppState"
import {ChangeCanvasAreaCommand} from "../commands/PictureCommand"
import DimensionSelectState from "../state/DimensionSelectState"
import DimensionSelect from "../views/DimensionSelect"

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

const CanvasAreaToolSettings = observer((props: {tool: CanvasAreaTool}) => {
  const {tool} = props
  const onOK = () => tool.endEditing()
  const onCancel = () => tool.cancelEditing()
  return (
    <div className="CanvasAreaToolSettings">
      <DimensionSelect state={tool.dimensionSelectState} percent={true} />
      <button className="Button Button-primary" onClick={onOK}>OK</button>
      <button className="Button" onClick={onCancel}>Cancel</button>
    </div>
  )
})

export default
class CanvasAreaTool extends RectMoveTool {
  name = "Canvas Area"
  handleRadius = HANDLE_RADIUS
  canRotate = false
  canDistort = false

  readonly dimensionSelectState = new DimensionSelectState()

  constructor(appState: AppState) {
    super(appState)
    reaction(() => this.active, active => {
      this.reset()
      if (!active) {
        this.cancelEditing()
      }
    })
    reaction(() => this.picture && this.picture.size, () => {
      this.reset()
    })
    reaction(() => this.rect.size.round(), action((size: Vec2) => {
      if (!this.dimensionSelectState.size.round().equals(size)) {
        this.dimensionSelectState.width = size.width
        this.dimensionSelectState.height = size.height
        this.dimensionSelectState.ratio = size.height / size.width
      }
    }))
    reaction(() => this.dimensionSelectState.size.round(), action((size: Vec2) => {
      if (!this.rect.size.round().equals(size)) {
        this.rect = new Rect(this.rect.topLeft, this.rect.topLeft.add(size))
      }
    }))
  }

  reset() {
    if (this.picture) {
      this.dimensionSelectState.reset(this.picture.dimension)
      this.dimensionSelectState.unit = "percent"
      this.resetRect(new Rect(new Vec2(), this.picture.size))
    }
  }

  @action start(e: ToolPointerEvent) {
    super.start(e)
    if (this.dragType != DragType.None) {
      this.startEditing()
    }
  }

  @action keyDown(ev: React.KeyboardEvent<HTMLElement>) {
    super.keyDown(ev)
    if (ev.key == "Enter") {
      this.endEditing()
    }
    if (ev.key == "Escape") {
      this.cancelEditing()
    }
  }

  renderOverlayUI() {
    return <CanvasAreaOverlayUI tool={this} />
  }

  renderSettings() {
    return <CanvasAreaToolSettings tool={this} />
  }

  startEditing() {
    this.startModal()
  }

  endEditing() {
    if (this.picture) {
      const rect = this.rect.translate(this.translation)
      const command = new ChangeCanvasAreaCommand(this.picture, rect)
      this.picture.undoStack.redoAndPush(command)
    }
    this.cancelEditing()
  }

  cancelEditing() {
    this.endModal()
    this.reset()
  }

}
