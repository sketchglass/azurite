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
  cursorElement: HTMLElement|undefined
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
      this.cursorPosition = this.offsetPos(ev)
    })
    IPCChannels.tabletUp.listen().forEach(ev => {
      this.usingTablet = false
      this.onPointerUp(ev)
    })

    this.resize()
    window.addEventListener("resize", () => {
      this.resize()
    })
    document.addEventListener("mousemove", (ev) => {
      if (!this.usingTablet) {
        this.cursorPosition = this.offsetPos(ev)
      }
    })
  }

  updateCursor() {
    const {cursor, cursorElementSize} = this.tool
    if (this.element) {
      if (this.cursorElement) {
        this.cursorElement.parentElement.removeChild(this.cursorElement)
      }

      const {cursorElement} = this.tool
      if (cursorElement) {
        this.element.style.cursor = "none"
        cursorElement.style.position = "absolute"
        this.element.appendChild(cursorElement)
        this.cursorElement = cursorElement
        this.updateCursorGeometry()
      } else {
        this.element.style.cursor = cursor
      }
    }
  }

  updateCursorGeometry() {
    const {x, y} = this.cursorPosition.floor()
    const {cursorElementSize} = this.tool
    if (this.cursorElement) {
      const center = cursorElementSize / 2
      const {style} = this.cursorElement
      style.left = `${x - center}px`
      style.top = `${y - center}px`
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
  }
  onMouseMove(ev: MouseEvent) {
    if (!this.usingTablet) {
      this.onPointerMove(ev)
    }
    ev.preventDefault()
  }
  onMouseUp(ev: MouseEvent) {
    if (!this.usingTablet) {
      this.onPointerUp(ev)
    }
    ev.preventDefault()
  }
  @action onPointerDown(ev: {clientX: number, clientY: number, pressure?: number}) {
    const {tool, picture} = this.props
    tool.picture = picture
    tool.renderer = this.renderer
    const {waypoint, rendererPos} = this.eventToWaypoint(ev)
    const rect = tool.start(waypoint, rendererPos)
    this.currentTool = tool
  }
  @action onPointerMove(ev: {clientX: number, clientY: number, pressure?: number}) {
    if (this.currentTool) {
      const {waypoint, rendererPos} = this.eventToWaypoint(ev)
      const rect = this.currentTool.move(waypoint, rendererPos)
    }
  }
  @action onPointerUp(ev: {clientX: number, clientY: number, pressure?: number}) {
    if (this.currentTool) {
      const rect = this.currentTool.end()
      this.currentTool = undefined
    }
  }
}
