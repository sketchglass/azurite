import React = require("react")
import Picture from "../models/Picture"
import {Vec2, Vec4, Transform} from "../../lib/Geometry"
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

  componentWillReceiveProps(nextProps: DrawAreaProps) {
    if (this.element) {
      this.element.style.cursor = nextProps.tool.cursor
    }
  }

  componentDidMount() {
    this.element = this.refs["root"] as HTMLElement
    this.element.appendChild(canvas)
    this.element.style.cursor = this.props.tool.cursor

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
    const rendererPos = new Vec2(x, y).mul(window.devicePixelRatio)
    const pos = this.renderer.transforms.rendererToPicture.transform(rendererPos)
    const waypoint = new Waypoint(pos, pressure)
    return {waypoint, rendererPos}
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
    const {tool, picture} = this.props
    tool.picture = picture
    tool.renderer = this.renderer
    const {waypoint, rendererPos} = this.eventToWaypoint(ev)
    const rect = tool.start(waypoint, rendererPos)
    this.isPressed = true
  }
  onPointerMove(ev: {clientX: number, clientY: number, pressure?: number}) {
    if (this.isPressed) {
      const {waypoint, rendererPos} = this.eventToWaypoint(ev)
      const rect = this.props.tool.move(waypoint, rendererPos)
    }
  }
  onPointerUp() {
    if (this.isPressed) {
      const rect = this.props.tool.end()
      this.isPressed = false
    }
  }
}
