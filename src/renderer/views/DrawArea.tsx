import {ipcRenderer} from 'electron'
import {observable, autorun, reaction} from 'mobx'
import {observer} from 'mobx-react'
import {Vec2, Rect} from 'paintvec'
import * as React from 'react'
import {TabletEvent} from 'receive-tablet-event'
import IPCChannels from '../../common/IPCChannels'
import {appState} from '../app/AppState'
import {canvas} from '../GLContext'
import Picture from '../models/Picture'
import Tool, {ToolPointerEvent} from '../tools/Tool'
import FrameDebounced from './components/FrameDebounced'
import PointerEvents from './components/PointerEvents'
import ScrollBar, {ScrollBarDirection} from './components/ScrollBar'
import './DrawArea.css'
import {renderer} from './Renderer'

@observer
class DrawAreaScroll extends FrameDebounced<{picture: Picture|undefined}, {}> {

  originalTranslation = new Vec2()

  onScrollBegin = () => {
    const {picture} = this.props
    if (!picture) {
      return
    }
    this.originalTranslation = picture.navigation.translation
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
    picture.navigation.translation = this.originalTranslation.sub(offset).round()
  }

  renderDebounced() {
    const {picture} = this.props
    if (!picture) {
      return <div />
    }
    const {scale, translation} = picture.navigation
    const pictureSize = picture.size.mulScalar(scale)
    const contentMin = pictureSize.mulScalar(-1.5)
    const contentMax = pictureSize.mulScalar(1.5)
    const visibleMin = renderer.size.mulScalar(-0.5).sub(translation)
    const visibleMax = renderer.size.mulScalar(0.5).sub(translation)

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
  usingTablet = false
  clientRect = new Rect()
  disposers: (() => void)[] = []

  constructor(props: DrawAreaProps) {
    super(props)
    this.picture = renderer.picture = props.picture
    this.setTool(props.tool)
  }

  setTool(tool: Tool) {
    this.tool = tool
    if (tool.renderOverlayCanvas) {
      const renderWithCanvas = tool.renderOverlayCanvas.bind(tool)
      renderer.overlay = {renderWithCanvas}
    } else {
      renderer.overlay = undefined
    }
    renderer.previewSelection = () => tool.previewSelection()
    renderer.dirtiness.addWhole()
    renderer.update()
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

    ipcRenderer.on(IPCChannels.tabletDown, this.onIPCTabletDown)
    ipcRenderer.on(IPCChannels.tabletMove, this.onIPCTabletMove)
    ipcRenderer.on(IPCChannels.tabletUp, this.onIPCTabletUp)

    this.resizeRenderer(true)
    window.addEventListener('resize', this.onResize)
    document.addEventListener('pointermove', this.onDocumentPointerMove)

    this.disposers = [
      () => ipcRenderer.removeListener(IPCChannels.tabletDown, this.onIPCTabletDown),
      () => ipcRenderer.removeListener(IPCChannels.tabletMove, this.onIPCTabletMove),
      () => ipcRenderer.removeListener(IPCChannels.tabletUp, this.onIPCTabletUp),
      () => window.removeEventListener('resize', this.onResize),
      () => document.removeEventListener('pointermove', this.onDocumentPointerMove),
      reaction(() => appState.uiVisible, () => setImmediate(() => this.onResize())),
      autorun(() => this.updateCursor()),
      reaction(() => this.tool.selectionShowMode, mode => {
        renderer.selectionShowMode = mode
      }),
    ]
  }

  componentWillUnmount() {
    this.disposers.forEach(d => d())
  }

  updateCursor() {
    const {cursor, cursorImage, cursorImageSize} = this.tool
    if (!this.element) {
      return
    }
    renderer.cursorVisible = !!cursorImage
    if (cursorImage) {
      this.element.style.cursor = 'none'
      renderer.cursorTexture.setImage(cursorImage)
      renderer.cursorSize = new Vec2(cursorImageSize)
    } else {
      this.element.style.cursor = cursor
    }
  }

  onResize = () => {
    this.resizeRenderer(false)
  }

  resizeRenderer(init: boolean) {
    const rect = this.element!.getBoundingClientRect()
    const roundRect = {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    }
    const topLeft = new Vec2(roundRect.left, roundRect.top)
    const size = new Vec2(roundRect.width, roundRect.height)
    const newRect = new Rect(topLeft, topLeft.add(size))
    if (!init && this.picture) {
      const {navigation} = this.picture
      const offset = newRect.center.sub(this.clientRect.center).mulScalar(devicePixelRatio).round()
      if (this.picture) {
        navigation.translation = navigation.translation.sub(offset)
      }
    }
    this.clientRect = newRect
    renderer.size = size.mulScalar(window.devicePixelRatio)
    canvas.style.left = `${roundRect.left}px`
    canvas.style.top = `${roundRect.top}px`
    canvas.style.width = `${roundRect.width}px`
    canvas.style.height = `${roundRect.height}px`

    ipcRenderer.send(IPCChannels.setTabletCaptureArea, roundRect)
  }

  render() {
    return (
      <div className="DrawArea">
        <PointerEvents onPointerDown={this.onPointerDown} onPointerMove={this.onPointerMove} onPointerUp={this.onPointerUp}>
          <div ref={e => this.element = e} className="DrawArea_content" tabIndex={-1} onKeyDown={this.onKeyDown} />
        </PointerEvents>
        <DrawAreaScroll picture={this.picture} />
        <div className="DrawArea_blank" hidden={!!this.picture} />
      </div>
    )
  }

  offsetPos(ev: {clientX: number, clientY: number}) {
    return new Vec2(ev.clientX, ev.clientY).sub(this.clientRect.topLeft)
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
      renderer.cursorPosition = this.offsetPos(ev).mulScalar(devicePixelRatio)
    }
  }

  onIPCTabletDown = (e: Electron.IpcRendererEvent, tabletEvent: TabletEvent) => {
    this.usingTablet = true
    this.onDown(this.toToolEvent(tabletEvent))
  }
  onIPCTabletMove = (e: Electron.IpcRendererEvent, tabletEvent: TabletEvent) => {
    const toolEv = this.toToolEvent(tabletEvent)
    renderer.cursorPosition = toolEv.rendererPos
    this.onMove(toolEv)
  }
  onIPCTabletUp = (e: Electron.IpcRendererEvent, tabletEvent: TabletEvent) => {
    this.usingTablet = false
    this.onUp(this.toToolEvent(tabletEvent))
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
