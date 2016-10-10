import React = require("react")
import Picture from "../models/Picture"
import {Vec2, Transform} from "paintvec"
import Tool from "../models/Tool"
import Waypoint from "../models/Waypoint"
import {TabletEvent} from "receive-tablet-event"
import {canvas} from "../GLContext"
import Renderer from "./Renderer"
import Navigation from "../models/Navigation"
import * as IPCChannels from "../../common/IPCChannels"

interface DrawAreaProps {
  tool: Tool
  picture: Picture
}

export default
class DrawArea extends React.Component<DrawAreaProps, void> {
  element: HTMLElement|undefined
  renderer: Renderer
  currentTool: Tool|undefined
  usingTablet = false

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

    IPCChannels.tabletDown.listen().forEach(ev => {
      this.usingTablet = true
      this.onPointerDown(ev)
    })
    IPCChannels.tabletMove.listen().forEach(ev => {
      this.onPointerMove(ev)
    })
    IPCChannels.tabletUp.listen().forEach(ev => {
      this.usingTablet = false
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
    const size = new Vec2(roundRect.width, roundRect.height).mulScalar(window.devicePixelRatio)
    this.renderer.resize(size)

    IPCChannels.setTabletCaptureArea.send(roundRect)
  }

  render() {
    return (
      <div ref="root" className="DrawArea"
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
    const rendererPos = new Vec2(x, y).mulScalar(window.devicePixelRatio)
    const pos = this.renderer.transforms.rendererToPicture.transform(rendererPos)
    const waypoint = new Waypoint(pos, pressure)
    return {waypoint, rendererPos}
  }

  onMouseDown(ev: MouseEvent) {
    if (!this.usingTablet) {
      this.onPointerDown(ev)
    }
    ev.preventDefault()
  }
  onMouseMove(ev: MouseEvent) {
    if (!this.usingTablet) {
      this.onPointerMove(ev)
    }
    ev.preventDefault()
  }
  onMouseUp(ev: MouseEvent) {
    if (!this.usingTablet) {
      this.onPointerUp()
    }
    ev.preventDefault()
  }
  onPointerDown(ev: {clientX: number, clientY: number, pressure?: number}) {
    const {tool, picture} = this.props
    tool.picture = picture
    tool.renderer = this.renderer
    const {waypoint, rendererPos} = this.eventToWaypoint(ev)
    const rect = tool.start(waypoint, rendererPos)
    this.currentTool = tool
  }
  onPointerMove(ev: {clientX: number, clientY: number, pressure?: number}) {
    if (this.currentTool) {
      const {waypoint, rendererPos} = this.eventToWaypoint(ev)
      const rect = this.currentTool.move(waypoint, rendererPos)
    }
  }
  onPointerUp() {
    if (this.currentTool) {
      const rect = this.currentTool.end()
      this.currentTool = undefined
    }
  }
}
