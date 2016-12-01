import {Transform, Vec2, Rect} from "paintvec"
import {computed, reaction} from "mobx"
import {observer} from "mobx-react"
import React = require("react")
import Picture from "../models/Picture"
import {appState} from "../state/AppState"
import {renderer} from "./Renderer"
import {frameDebounce} from "../../lib/Debounce"
import PointerEvents from "./components/PointerEvents"
import SVGIcon from "./components/SVGIcon"

interface NavigatorProps {
  picture: Picture|undefined
}

class NavigatorMinimap extends React.Component<{}, {} > {
  private minimap: HTMLCanvasElement
  private disposer: () => void
  private dragging = false
  private dragStartPos = new Vec2()
  private originalTranslation = new Vec2()

  @computed private get picture() {
    return appState.currentPicture
  }

  componentDidMount() {
    this.disposer = reaction(() => {
      const {picture} = this
      if (picture) {
        const {scale, translation, rotation} = picture.navigation
        const {size} = renderer
        return [picture.lastUpdate, scale, translation, rotation, size]
      }
    }, frameDebounce(() => this.redraw()))
  }

  componentWillUnmount() {
    this.disposer()
  }

  private redraw() {
    const {width, height} = this.minimap
    const context = this.minimap.getContext('2d')!
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, width, height)

    if (!this.picture) {
      return
    }
    context.translate(width / 2, height / 2)

    this.picture.updateNavigatorThumbnail()
    const thumbnail = this.picture.navigatorThumbnail
    const thumbanilScale = this.picture.navigatorThumbnailScale
    context.drawImage(thumbnail, -thumbnail.width / 2, -thumbnail.height / 2)

    const {scale, rotation, translation} = this.picture.navigation
    const transform = Transform.rotate(-rotation).scale(new Vec2(1 / scale)).translate(translation.neg()).scale(new Vec2(thumbanilScale))
    const rendererSize = renderer.size
    const rendererTopLeft = rendererSize.divScalar(2).neg()
    const rendererBottomRight = rendererSize.add(rendererTopLeft)
    const rendererRect = new Rect(rendererTopLeft, rendererBottomRight)
    const vertices = rendererRect.vertices().map(p => p.transform(transform))

    context.strokeStyle = "grey"
    context.lineWidth = devicePixelRatio
    context.beginPath()
    context.moveTo(vertices[3].x, vertices[3].y)
    for (const v of vertices) {
      context.lineTo(v.x, v.y)
    }
    context.stroke()
  }

  private picturePosForEvent(e: {clientX: number, clientY: number}) {
    if (!this.picture) {
      return new Vec2()
    }
    const {left, top, width, height} = this.minimap.getBoundingClientRect()
    return new Vec2(e.clientX - left - width / 2, e.clientY - top - height / 2).mulScalar(devicePixelRatio).divScalar(this.picture.navigatorThumbnailScale).round()
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this.picture) {
      return
    }
    this.minimap.setPointerCapture(e.pointerId)
    const pos = this.picturePosForEvent(e)
    const rendererPos = (pos.add(this.picture.size.mulScalar(0.5))).transform(renderer.transformFromPicture)
    if (!new Rect(new Vec2(), renderer.size).includes(rendererPos)) {
      this.picture.navigation.translation = pos.neg()
    }

    this.dragging = true
    this.dragStartPos = pos
    this.originalTranslation = this.picture.navigation.translation
  }
  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging) {
      return
    }
    if (!this.picture) {
      return
    }
    const pos = this.picturePosForEvent(e)
    const offset = this.dragStartPos.sub(pos)
    this.picture.navigation.translation = this.originalTranslation.add(offset)
  }
  private onPointerUp = (e: PointerEvent) => {
    this.dragging = false
  }

  render() {
    const width = 240 * devicePixelRatio
    const height = 120 * devicePixelRatio
    return (
      <PointerEvents onPointerDown={this.onPointerDown} onPointerMove={this.onPointerMove} onPointerUp={this.onPointerUp}>
        <canvas className="Navigator_minimap" width={width} height={height} ref={e => this.minimap = e} />
      </PointerEvents>
    )
  }
}

@observer export default
class Navigator extends React.Component<NavigatorProps, {}> {
  constructor(props: NavigatorProps) {
    super(props)
  }

  private onScaleChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const {picture} = this.props
    if (picture) {
      picture.navigation.scale = parseFloat((ev.target as HTMLInputElement).value) / 100
    }
  }

  private onRotationChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const {picture} = this.props
    if (picture) {
      picture.navigation.rotation = parseInt((ev.target as HTMLInputElement).value) * 3 / 180 * Math.PI
    }
  }

  private onHorizontalFlipChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const {picture} = this.props
    if (picture) {
      picture.navigation.horizontalFlip = (ev.target as HTMLInputElement).checked
    }
  }

  render() {
    const {picture} = this.props

    const navigation = picture ? picture.navigation : {rotation: 0, scale: 1, horizontalFlip: false}
    const {rotation, scale, horizontalFlip} = navigation
    const scalePercent = Math.round(scale * 100)
    const rotationDeg = Math.round(rotation / Math.PI * 180)
    const rotationDegBy3 = Math.round(rotationDeg / 3)

    return (
      <div className="Navigator">
        <NavigatorMinimap />
        <div className="Navigator_sliderRow">
          <button><SVGIcon className="zoom-out" /></button>
          <input type="range" max={1600} onChange={this.onScaleChange} value={scalePercent} />
          <button><SVGIcon className="zoom-in" /></button>
          {scalePercent}%
        </div>
        <div className="Navigator_sliderRow">
          <button><SVGIcon className="rotate-left" /></button>
          <input type="range" min={-60} max={60} onChange={this.onRotationChange} value={rotationDegBy3} />
          <button><SVGIcon className="rotate-right" /></button>
          {rotationDeg}°
        </div>
        <div>
          <label><input type="checkbox" checked={horizontalFlip} onChange={this.onHorizontalFlipChange} />Flip Horizontally</label>
        </div>
      </div>
    )
  }
}
