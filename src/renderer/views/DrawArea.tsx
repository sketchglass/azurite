import React = require("react")
import Picture from "../models/Picture"
import {Vec2, Transform} from "../../lib/Geometry"
import Tool from "../models/Tool"
import Waypoint from "../models/Waypoint"
import * as Electron from "electron"
import {TabletEvent} from "receive-tablet-event"
import {canvas} from "../GLContext"
import Renderer from "./Renderer"
import Navigation from "../models/Navigation"

const {ipcRenderer} = Electron

interface DrawAreaProps {
  tool: Tool
  picture: Picture
}

export default
class DrawArea extends React.Component<DrawAreaProps, void> {
  element: HTMLElement|undefined
  isPressed = false
  renderer: Renderer

  constructor(props: DrawAreaProps) {
    super(props)
    this.renderer = new Renderer(props.picture)
    props.picture.changed.forEach(() => {
      this.forceUpdate()
    })
  }

  componentDidMount() {
    this.element = this.refs["root"] as HTMLElement
    if (this.element.childElementCount == 0) {
      this.element.appendChild(canvas)
    }

    ipcRenderer.on("tablet.down", (event: Electron.IpcRendererEvent, ev: TabletEvent) => {
      this.onPointerDown(ev)
    })
    ipcRenderer.on("tablet.move", (event: Electron.IpcRendererEvent, ev: TabletEvent) => {
      this.onPointerMove(ev)
    })
    ipcRenderer.on("tablet.up", (event: Electron.IpcRendererEvent, ev: TabletEvent) => {
      this.onPointerUp()
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

  eventToWaypoint(ev: {clientX: number, clientY: number, pressure?: number}) {
    const rect = this.element!.getBoundingClientRect()
    const x = ev.clientX - rect.left
    const y = ev.clientY - rect.top
    const pressure = ev.pressure == undefined ? 1.0 : ev.pressure
    const pos = this.renderer.transforms.domToPicture.transform(new Vec2(x, y).mul(window.devicePixelRatio))
    return new Waypoint(pos, pressure)
  }

  onMouseDown(ev: MouseEvent) {
    this.onPointerDown(ev)
    ev.preventDefault()
  }
  onMouseMove(ev: MouseEvent) {
    this.onPointerMove(ev)
    ev.preventDefault()
  }
  onMouseUp(ev: MouseEvent) {
    this.onPointerUp()
    ev.preventDefault()
  }
  onPointerDown(ev: {clientX: number, clientY: number, pressure?: number}) {
    const rect = this.props.tool.start(this.eventToWaypoint(ev))
    this.props.picture.layerBlender.render(rect)
    this.renderer.render(rect)
    this.isPressed = true
  }
  onPointerMove(ev: {clientX: number, clientY: number, pressure?: number}) {
    if (this.isPressed) {
      const rect = this.props.tool.move(this.eventToWaypoint(ev))
      this.props.picture.layerBlender.render(rect)
      this.renderer.render(rect)
    }
  }
  onPointerUp() {
    if (this.isPressed) {
      const rect = this.props.tool.end()
      this.props.picture.layerBlender.render(rect)
      this.renderer.render(rect)
      this.isPressed = false
    }
  }
}
