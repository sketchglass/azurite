import {observable, autorun, runInAction} from "mobx"
import {observer} from "mobx-react"
import {Subscription} from "rxjs/Subscription"
import React = require("react")
import Picture from "../models/Picture"
import {Vec2, Transform} from "paintvec"
import Tool, {ToolPointerEvent} from "../tools/Tool"
import {TabletEvent} from "receive-tablet-event"
import {canvas} from "../GLContext"
import {renderer} from "./Renderer"
import * as IPCChannels from "../../common/IPCChannels"
import PointerEvents from "./components/PointerEvents"
import ScrollBar, {ScrollBarDirection} from "./components/ScrollBar"
import FrameDebounced from "./components/FrameDebounced"

@observer
class DrawAreaScroll extends FrameDebounced<{picture: Picture|undefined}, {}> {

  originalRendererTranslation = new Vec2()

  onScrollBegin = () => {
    const {picture} = this.props
    if (!picture) {
      return
    }
    const {scale, rotation, translation} = picture.navigation
    this.originalRendererTranslation = translation.transform(Transform.scale(new Vec2(scale)).rotate(rotation))
  }

  onXScroll = (value: number) => {
    this.onScroll(new Vec2(value, 0))
  }

  onYScroll = (value: number) => {
    this.onScroll(new Vec2(0, value))
  }

  onScroll = (offset: Vec2) => {
    const {picture} = this.props
    if (!picture) {
      return
    }
    const {scale, rotation} = picture.navigation
    const rendererTranslation = this.originalRendererTranslation.sub(offset)
    picture.navigation.translation = rendererTranslation.transform(Transform.scale(new Vec2(1 / scale)).rotate(-rotation)).floor()
  }

  renderDebounced() {
    const {picture} = this.props
    if (!picture) {
      return <div />
    }
    const {scale, rotation, translation} = picture.navigation
    const pictureSize = picture.size.mulScalar(scale)
    const contentMin = pictureSize.mulScalar(-1.5)
    const contentMax = pictureSize.mulScalar(1.5)
    const rendererTranslation = translation.transform(Transform.scale(new Vec2(scale)).rotate(rotation))
    const visibleMin = renderer.size.mulScalar(-0.5).sub(rendererTranslation)
    const visibleMax = renderer.size.mulScalar(0.5).sub(rendererTranslation)

    return (
      <div>
        <ScrollBar direction={ScrollBarDirection.Horizontal}
          contentMin={contentMin.x} contentMax={contentMax.x} visibleMin={visibleMin.x} visibleMax={visibleMax.x} onChangeBegin={this.onScrollBegin} onChange={this.onXScroll}/>
        <ScrollBar direction={ScrollBarDirection.Vertical}
          contentMin={contentMin.y} contentMax={contentMax.y} visibleMin={visibleMin.y} visibleMax={visibleMax.y} onChangeBegin={this.onScrollBegin} onChange={this.onYScroll}/>
      </div>
    )
  }
}

interface DrawAreaProps {
  tool: Tool
  picture: Picture|undefined
}

@observer
export default
class DrawArea extends React.Component<DrawAreaProps, void> {
  element: HTMLElement|undefined
  @observable tool: Tool
  @observable picture: Picture|undefined
  currentTool: Tool|undefined
  @observable cursorPosition = new Vec2()
  usingTablet = false
  tabletDownSubscription: Subscription
  tabletMoveSubscription: Subscription
  tabletUpSubscription: Subscription
  clientTopLeft = new Vec2()

  constructor(props: DrawAreaProps) {
    super(props)
    this.picture = renderer.picture = props.picture
    this.setTool(props.tool)
    autorun(() => this.updateCursor())
  }

  setTool(tool: Tool) {
    this.tool = tool
    this.tool.renderer = renderer
    if (tool.renderOverlayCanvas) {
      const renderWithCanvas = tool.renderOverlayCanvas.bind(tool)
      renderer.overlay = {renderWithCanvas}
    } else {
      renderer.overlay = undefined
    }
  }

  componentWillReceiveProps(nextProps: DrawAreaProps) {
    // TODO: stop setting picture and tool manually and find way to use mobx
    this.picture = renderer.picture = nextProps.picture
    this.setTool(nextProps.tool)
  }

  componentDidMount() {
    const element = this.element!
    element.insertBefore(canvas, element.firstChild)
    this.updateCursor()

    this.tabletDownSubscription = IPCChannels.tabletDown.listen().subscribe(ev => {
      this.usingTablet = true
      this.onDown(this.toToolEvent(ev))
    })
    this.tabletMoveSubscription = IPCChannels.tabletMove.listen().subscribe(ev => {
      const toolEv = this.toToolEvent(ev)
      this.cursorPosition = toolEv.rendererPos
      this.onMove(toolEv)
    })
    this.tabletUpSubscription = IPCChannels.tabletUp.listen().subscribe(ev => {
      this.usingTablet = false
      this.onUp(this.toToolEvent(ev))
    })

    this.onResize()
    window.addEventListener("resize", this.onResize)
    document.addEventListener("pointermove", this.onDocumentPointerMove)
  }

  componentWillUnmount() {
    this.tabletDownSubscription.unsubscribe()
    this.tabletMoveSubscription.unsubscribe()
    this.tabletUpSubscription.unsubscribe()
    window.removeEventListener("resize", this.onResize)
    document.removeEventListener("pointermove", this.onDocumentPointerMove)
  }

  updateCursor() {
    const {cursor, cursorImage, cursorImageSize} = this.tool
    const {cursorPosition} = this
    runInAction(() => {
      if (!this.element) {
        return
      }
      renderer.cursorVisible = !!cursorImage
      if (cursorImage) {
        this.element.style.cursor = "none"
        renderer.cursorTexture.setImage(cursorImage)
        renderer.cursorPosition = cursorPosition.round()
        renderer.cursorSize = new Vec2(cursorImageSize)
      } else {
        this.element.style.cursor = cursor
      }
    })
  }

  onResize = () => {
    const rect = this.element!.getBoundingClientRect()
    const roundRect = {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    }
    this.clientTopLeft = new Vec2(roundRect.left, roundRect.top)
    renderer.size = new Vec2(roundRect.width, roundRect.height).mulScalar(window.devicePixelRatio)

    IPCChannels.setTabletCaptureArea.send(roundRect)
  }

  render() {
    const style = {visibility: this.picture ? "visible" : "hidden"}

    return (
      <div className="DrawArea_wrapper">
        <PointerEvents onPointerDown={this.onPointerDown} onPointerMove={this.onPointerMove} onPointerUp={this.onPointerUp}>
          <div ref={e => this.element = e} className="DrawArea" style={style} tabIndex={-1} onKeyDown={this.onKeyDown} />
        </PointerEvents>
        <DrawAreaScroll picture={this.picture} />
      </div>
    )
  }

  offsetPos(ev: {clientX: number, clientY: number}) {
    return new Vec2(ev.clientX, ev.clientY).sub(this.clientTopLeft)
  }

  toToolEvent(ev: PointerEvent | TabletEvent): ToolPointerEvent {
    const {pressure, button, altKey, ctrlKey, metaKey, shiftKey} = ev
    const rendererPos = this.offsetPos(ev).mulScalar(window.devicePixelRatio)
    const picturePos = rendererPos.transform(renderer.transformToPicture)
    return {
      rendererPos, picturePos, pressure, button, altKey, ctrlKey, metaKey, shiftKey
    }
  }

  onDocumentPointerMove = (ev: PointerEvent) => {
    if (!this.usingTablet) {
      this.cursorPosition = this.offsetPos(ev).mulScalar(devicePixelRatio)
    }
  }

  onPointerDown = (ev: PointerEvent) => {
    if (!this.usingTablet) {
      this.onDown(this.toToolEvent(ev))
      this.element!.setPointerCapture(ev.pointerId)
    }
    ev.preventDefault()
  }
  onPointerMove = (ev: PointerEvent) => {
    if (!this.usingTablet) {
      this.onMove(this.toToolEvent(ev))
    }
    ev.preventDefault()
  }
  onPointerUp = (ev: PointerEvent) => {
    if (!this.usingTablet) {
      this.onUp(this.toToolEvent(ev))
    }
    ev.preventDefault()
  }
  onDown(ev: ToolPointerEvent) {
    this.element && this.element.focus()
    const {tool} = this.props
    tool.start(ev)
    this.currentTool = tool
  }
  onMove(ev: ToolPointerEvent) {
    if (this.currentTool) {
      this.currentTool.move(ev)
    } else {
      this.tool.hover(ev)
    }
  }
  onUp(ev: ToolPointerEvent) {
    if (this.currentTool) {
      this.currentTool.end(ev)
      this.currentTool = undefined
    }
  }

  onKeyDown = (ev: React.KeyboardEvent<HTMLElement>) => {
    this.tool.keyDown(ev)
  }
}
