import React = require("react")
import Picture from "../models/Picture"
import {Point} from "../models/Geometry"
import Tool from "../models/Tool"
import BrushTool from "../models/BrushTool"
import Pointer from "../models/Pointer"

interface DrawAreaState {
  picture: Picture
}

export default
class DrawArea extends React.Component<void, DrawAreaState> {
  element: HTMLElement|undefined
  isPressed = false
  tool: Tool = new BrushTool()

  constructor() {
    super()
    this.state = {
      picture: new Picture()
    }
    this.tool.layer = this.state.picture.layers[0]
  }

  componentDidMount() {
    this.element = this.refs["root"] as HTMLElement
    this.updateChildCanvases()
  }

  updateChildCanvases() {
    const {element} = this
    if (element) {
      while (element.firstChild) {
        element.removeChild(element.firstChild)
      }
      for (const layer of this.state.picture.layers) {
        element.appendChild(layer.canvas)
      }
    }
  }

  render() {
    this.updateChildCanvases()
    return (
      <div ref="root" className="draw-area"
        onMouseDown={this.onMouseDown.bind(this)}
        onMouseMove={this.onMouseMove.bind(this)}
        onMouseUp={this.onMouseUp.bind(this)}
      />
    )
  }

  mousePos(ev: MouseEvent) {
    const rect = this.element!.getBoundingClientRect()
    const x = ev.clientX - rect.left
    const y = ev.clientY - rect.top
    return new Point(x, y)
  }

  onMouseDown(ev: MouseEvent) {
    const pos = this.mousePos(ev)
    this.tool.start(new Pointer(pos, 1))
    this.isPressed = true
    ev.preventDefault()
  }
  onMouseMove(ev: MouseEvent) {
    const pos = this.mousePos(ev)

    if (this.isPressed) {
      this.tool.move(new Pointer(pos, 1))
      ev.preventDefault()
    }
  }
  onMouseUp(ev: MouseEvent) {
    if (this.isPressed) {
      this.tool.end()
      this.isPressed = false
      ev.preventDefault()
    }
  }
}
