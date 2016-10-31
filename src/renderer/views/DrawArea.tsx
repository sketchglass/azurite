import {observable, autorun, action, observe} from "mobx"
import {Subscription} from "rxjs/Subscription"
import React = require("react")
import Picture from "../models/Picture"
import {Vec2, Transform} from "paintvec"
import Tool from "../tools/Tool"
import Waypoint from "../models/Waypoint"
import {TabletEvent} from "receive-tablet-event"
import {canvas} from "../GLContext"
import Renderer from "./Renderer"
import Navigation from "../models/Navigation"
import * as IPCChannels from "../../common/IPCChannels"

interface DrawAreaProps {
  tool: Tool
  picture: Picture|undefined
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
  tabletDownSubscription: Subscription
  tabletMoveSubscription: Subscription
  tabletUpSubscription: Subscription

  constructor(props: DrawAreaProps) {
    super(props)
    this.renderer = new Renderer()
    this.renderer.picture = props.picture
    this.tool = props.tool
    autorun(() => this.updateCursor())
    autorun(() => this.updateCursorGeometry())
  }

  componentWillReceiveProps(nextProps: DrawAreaProps) {
    this.renderer.picture = nextProps.picture
    this.tool = nextProps.tool
  }

  componentDidMount() {
    this.element = this.refs["root"] as HTMLElement
    this.element.appendChild(canvas)
    this.updateCursor()

    this.element.addEventListener("pointerdown", this.onPointerDown)
    this.element.addEventListener("pointermove", this.onPointerMove)
    this.element.addEventListener("pointerup", this.onPointerUp)

    this.tabletDownSubscription = IPCChannels.tabletDown.listen().subscribe(ev => {
      this.usingTablet = true
      this.onDown(ev)
    })
    this.tabletMoveSubscription = IPCChannels.tabletMove.listen().subscribe(ev => {
      this.onMove(ev)
      this.cursorPosition = this.offsetPos(ev)
    })
    this.tabletUpSubscription = IPCChannels.tabletUp.listen().subscribe(ev => {
      this.usingTablet = false
      this.onUp()
    })

    this.onResize()
    window.addEventListener("resize", this.onResize)
    document.addEventListener("pointermove", this.onDocumentPointerMove)
  }

  componentWillUnmount() {
    const element = this.element!
    element.removeEventListener("pointerdown", this.onPointerDown)
    element.removeEventListener("pointermove", this.onPointerMove)
    element.removeEventListener("pointerup", this.onPointerUp)
    this.tabletDownSubscription.unsubscribe()
    this.tabletMoveSubscription.unsubscribe()
    this.tabletUpSubscription.unsubscribe()
    window.removeEventListener("resize", this.onResize)
    document.removeEventListener("pointermove", this.onDocumentPointerMove)
  }

  updateCursor() {
    const {cursor, cursorElement} = this.tool
    if (this.element) {
      if (this.cursorElement && this.cursorElement.parentElement) {
        this.cursorElement.parentElement.removeChild(this.cursorElement)
      }

      if (cursorElement) {
        this.element.style.cursor = "none"
        cursorElement.className = "DrawArea_Cursor"
        this.element.appendChild(cursorElement)
        this.cursorElement = cursorElement
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

  onResize = () => {
    const rect = this.element!.getBoundingClientRect()
    const roundRect = {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    }
    this.renderer.size = new Vec2(roundRect.width, roundRect.height).mulScalar(window.devicePixelRatio)

    IPCChannels.setTabletCaptureArea.send(roundRect)
  }

  render() {
    const style = {visibility: this.props.picture ? "visible" : "hidden"}
    return (
      <div ref="root" className="DrawArea" style={style} />
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
    const pos = rendererPos.transform(this.renderer.transformToPicture)
    const waypoint = new Waypoint(pos, pressure)
    return {waypoint, rendererPos}
  }

  onDocumentPointerMove = (ev: PointerEvent) => {
    if (!this.usingTablet) {
      this.cursorPosition = this.offsetPos(ev)
    }
  }

  onPointerDown = (ev: PointerEvent) => {
    if (!this.usingTablet) {
      this.onDown(ev)
      this.element!.setPointerCapture(ev.pointerId)
    }
    ev.preventDefault()
  }
  onPointerMove = (ev: PointerEvent) => {
    if (!this.usingTablet) {
      this.onMove(ev)
    }
    ev.preventDefault()
  }
  onPointerUp = (ev: PointerEvent) => {
    if (!this.usingTablet) {
      this.onUp()
    }
    ev.preventDefault()
  }
  onDown(ev: {clientX: number, clientY: number, pressure?: number}) {
    const {tool, picture} = this.props
    if (!picture) {
      return
    }
    tool.renderer = this.renderer
    const {waypoint, rendererPos} = this.eventToWaypoint(ev)
    const rect = tool.start(waypoint, rendererPos)
    this.currentTool = tool
  }
  onMove(ev: {clientX: number, clientY: number, pressure?: number}) {
    if (this.currentTool) {
      const {waypoint, rendererPos} = this.eventToWaypoint(ev)
      const rect = this.currentTool.move(waypoint, rendererPos)
    }
  }
  onUp() {
    if (this.currentTool) {
      const rect = this.currentTool.end()
      this.currentTool = undefined
    }
  }
}
