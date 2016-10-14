import {observable, autorun, action, observe} from "mobx"
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
  @observable tool: Tool
  currentTool: Tool|undefined
  cursorCanvas: HTMLCanvasElement|undefined
  @observable cursorPosition = new Vec2()
  usingTablet = false

  constructor(props: DrawAreaProps) {
    super(props)
    this.renderer = new Renderer(props.picture)
    this.tool = props.tool
    autorun(() => this.updateCursor())
    autorun(() => this.updateCursorGeometry())
  }

  componentWillReceiveProps(nextProps: DrawAreaProps) {
    this.tool = nextProps.tool
  }

  componentDidMount() {
    this.element = this.refs["root"] as HTMLElement
    this.element.appendChild(canvas)
    this.updateCursor()

    IPCChannels.tabletDown.listen().forEach(ev => {
      this.usingTablet = true
      this.onPointerDown(ev)
    })
    IPCChannels.tabletMove.listen().forEach(ev => {
      this.onPointerMove(ev)
    })
    IPCChannels.tabletUp.listen().forEach(ev => {
      this.usingTablet = false
      this.onPointerUp(ev)
    })

    this.resize()
    window.addEventListener("resize", () => {
      this.resize()
    })
  }

  updateCursor() {
    const {cursor, cursorCanvasSize} = this.tool
    if (this.element) {
      const {cursorCanvas} = this.tool
      if (cursorCanvas) {
        this.element.style.cursor = "none"
        const center = cursorCanvasSize / 2
        const dpr = window.devicePixelRatio
        const {style} = cursorCanvas
        style.position = "absolute"
        this.element.appendChild(cursorCanvas)
        this.cursorCanvas = cursorCanvas
        this.updateCursorGeometry()
      } else {
        this.element.style.cursor = cursor
      }
    }
  }

  updateCursorGeometry() {
    const {x, y} = this.cursorPosition.floor()
    const {cursorCanvasSize} = this.tool
    if (this.cursorCanvas) {
      const center = cursorCanvasSize / 2
      const dpr = window.devicePixelRatio
      const {style} = this.cursorCanvas
      style.left = `${x - center/dpr}px`
      style.top = `${y - center/dpr}px`
      style.width = `${cursorCanvasSize/dpr}px`
      style.height = `${cursorCanvasSize/dpr}px`
    }
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

  offsetPos(ev: {clientX: number, clientY: number}) {
    const rect = this.element!.getBoundingClientRect()
    const x = ev.clientX - rect.left
    const y = ev.clientY - rect.top
    return new Vec2(x, y)
  }

  eventToWaypoint(ev: {clientX: number, clientY: number, pressure?: number}) {
    const pressure = ev.pressure == undefined ? 1.0 : ev.pressure
    const rendererPos = this.offsetPos(ev).mulScalar(window.devicePixelRatio)
    const pos = rendererPos.transform(this.renderer.transforms.rendererToPicture)
    const waypoint = new Waypoint(pos, pressure)
    return {waypoint, rendererPos}
  }

  onMouseDown(ev: MouseEvent) {
    if (!this.usingTablet) {
      this.onPointerDown(ev)
    }
    ev.preventDefault()
    this.cursorPosition = this.offsetPos(ev)
  }
  onMouseMove(ev: MouseEvent) {
    if (!this.usingTablet) {
      this.onPointerMove(ev)
    }
    ev.preventDefault()
    this.cursorPosition = this.offsetPos(ev)
  }
  onMouseUp(ev: MouseEvent) {
    if (!this.usingTablet) {
      this.onPointerUp(ev)
    }
    ev.preventDefault()
    this.cursorPosition = this.offsetPos(ev)
  }
  @action onPointerDown(ev: {clientX: number, clientY: number, pressure?: number}) {
    const {tool, picture} = this.props
    tool.picture = picture
    tool.renderer = this.renderer
    const {waypoint, rendererPos} = this.eventToWaypoint(ev)
    const rect = tool.start(waypoint, rendererPos)
    this.currentTool = tool
    this.cursorPosition = this.offsetPos(ev)
  }
  @action onPointerMove(ev: {clientX: number, clientY: number, pressure?: number}) {
    if (this.currentTool) {
      const {waypoint, rendererPos} = this.eventToWaypoint(ev)
      const rect = this.currentTool.move(waypoint, rendererPos)
    }
    this.cursorPosition = this.offsetPos(ev)
  }
  @action onPointerUp(ev: {clientX: number, clientY: number, pressure?: number}) {
    if (this.currentTool) {
      const rect = this.currentTool.end()
      this.currentTool = undefined
    }
    this.cursorPosition = this.offsetPos(ev)
  }
}
