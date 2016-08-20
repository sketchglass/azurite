import React = require("react")
import Picture from "../models/Picture"
import {Vec2} from "../../lib/Geometry"
import Tool from "../models/Tool"
import BrushTool from "../models/BrushTool"
import Waypoint from "../models/Waypoint"
import * as Electron from "electron"
import {TabletEvent} from "receive-tablet-event"
import BrushSettings from "./BrushSettings"

const {ipcRenderer} = Electron

interface DrawAreaProps {
  tool: Tool
  picture: Picture
}

export default
class DrawArea extends React.Component<DrawAreaProps, void> {
  element: HTMLElement|undefined
  isPressed = false

  constructor(props: DrawAreaProps) {
    super(props)
    props.tool.layer = props.picture.layers[0]
  }

  componentDidMount() {
    this.element = this.refs["root"] as HTMLElement
    this.updateChildCanvases()

    const rect = this.element.getBoundingClientRect()
    const captureArea = {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    }
    ipcRenderer.send("tablet.install", captureArea)
    const {tool} = this.props

    ipcRenderer.on("tablet.down", (event: Electron.IpcRendererEvent, ev: TabletEvent) => {
      const pos = this.mousePos(ev)
      tool.start(new Waypoint(pos, ev.pressure))
      this.isPressed = true
    })
    ipcRenderer.on("tablet.move", (event: Electron.IpcRendererEvent, ev: TabletEvent) => {
      if (this.isPressed) {
        const pos = this.mousePos(ev)
        tool.move(new Waypoint(pos, ev.pressure))
      }
    })
    ipcRenderer.on("tablet.up", (event: Electron.IpcRendererEvent, ev: TabletEvent) => {
      if (this.isPressed) {
        tool.end()
        this.isPressed = false
      }
    })
  }

  updateChildCanvases() {
    const {element} = this
    if (element) {
      while (element.firstChild) {
        element.removeChild(element.firstChild)
      }
      for (const layer of this.props.picture.layers) {
        element.appendChild(layer.canvas)
      }
    }
  }

  render() {
    this.updateChildCanvases()
    const dpr = window.devicePixelRatio;
    const style = {
      width: this.props.picture.size.width / dpr + 'px',
      height: this.props.picture.size.height / dpr + 'px',
    }
    return (
      <div ref="root" className="draw-area" style={style}
        onMouseDown={this.onMouseDown.bind(this)}
        onMouseMove={this.onMouseMove.bind(this)}
        onMouseUp={this.onMouseUp.bind(this)}
      />
    )
  }

  mousePos(ev: {clientX: number, clientY: number}) {
    const dpr = window.devicePixelRatio
    const rect = this.element!.getBoundingClientRect()
    const x = ev.clientX - rect.left
    const y = ev.clientY - rect.top
    return new Vec2(x * dpr, y * dpr)
  }

  onMouseDown(ev: MouseEvent) {
    const pos = this.mousePos(ev)
    this.props.tool.start(new Waypoint(pos, 1))
    this.isPressed = true
    ev.preventDefault()
  }
  onMouseMove(ev: MouseEvent) {
    const pos = this.mousePos(ev)

    if (this.isPressed) {
      this.props.tool.move(new Waypoint(pos, 1))
      ev.preventDefault()
    }
  }
  onMouseUp(ev: MouseEvent) {
    if (this.isPressed) {
      this.props.tool.end()
      this.isPressed = false
      ev.preventDefault()
    }
  }
}
