import React = require("react")
import Picture from "../models/Picture"
import {Vec2, Transform} from "../../lib/Geometry"
import Tool from "../models/Tool"
import Waypoint from "../models/Waypoint"
import * as Electron from "electron"
import {TabletEvent} from "receive-tablet-event"
import {canvas} from "../GLContext"
import Renderer from "./Renderer"

const {ipcRenderer} = Electron

interface DrawAreaProps {
  tool: Tool
  picture: Picture
}

export default
class DrawArea extends React.Component<DrawAreaProps, void> {
  element: HTMLElement|undefined
  isPressed = false
  renderer: Renderer;
  drawAreaToPicture = Transform.identity

  constructor(props: DrawAreaProps) {
    super(props)
    props.tool.layer = props.picture.layers[0]
    this.renderer = new Renderer(props.picture)
  }

  componentDidMount() {
    this.element = this.refs["root"] as HTMLElement
    if (this.element.childElementCount == 0) {
      this.element.appendChild(canvas)
    }

    const {tool} = this.props

    ipcRenderer.on("tablet.down", (event: Electron.IpcRendererEvent, ev: TabletEvent) => {
      const pos = this.mousePos(ev)
      tool.start(new Waypoint(pos, ev.pressure))
      this.renderer.render()
      this.isPressed = true
    })
    ipcRenderer.on("tablet.move", (event: Electron.IpcRendererEvent, ev: TabletEvent) => {
      if (this.isPressed) {
        const pos = this.mousePos(ev)
        tool.move(new Waypoint(pos, ev.pressure))
        this.renderer.render()
      }
    })
    ipcRenderer.on("tablet.up", (event: Electron.IpcRendererEvent, ev: TabletEvent) => {
      if (this.isPressed) {
        tool.end()
        this.renderer.render()
        this.isPressed = false
      }
    })

    this.resize()
    window.addEventListener("resize", () => {
      this.resize()
    })
  }

  resize() {
    const rect = this.element!.getBoundingClientRect()
    const roundRect = {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    }
    const size = new Vec2(roundRect.width, roundRect.height).mul(window.devicePixelRatio)
    this.renderer.resize(size)
    this.drawAreaToPicture = Transform.translate(
      size.sub(this.props.picture.size).mul(-0.5)
    )
    ipcRenderer.send("tablet.install", roundRect)
  }

  render() {
    this.renderer.render()
    return (
      <div ref="root" className="draw-area"
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
    return this.drawAreaToPicture.transform(new Vec2(x * dpr, y * dpr))
  }

  onMouseDown(ev: MouseEvent) {
    const pos = this.mousePos(ev)
    this.props.tool.start(new Waypoint(pos, 1))
    this.renderer.render()
    this.isPressed = true
    ev.preventDefault()
  }
  onMouseMove(ev: MouseEvent) {
    const pos = this.mousePos(ev)

    if (this.isPressed) {
      this.props.tool.move(new Waypoint(pos, 1))
      this.renderer.render()
      ev.preventDefault()
    }
  }
  onMouseUp(ev: MouseEvent) {
    if (this.isPressed) {
      this.props.tool.end()
      this.renderer.render()
      this.isPressed = false
      ev.preventDefault()
    }
  }
}
