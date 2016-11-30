import {Transform, Vec2, Rect} from "paintvec"
import {computed, reaction} from "mobx"
import {observer} from "mobx-react"
import React = require("react")
import Picture from "../models/Picture"
import {appState} from "../state/AppState"
import {renderer} from "./Renderer"
import {frameDebounce} from "../../lib/Debounce"
import PointerEvents from "./components/PointerEvents"

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
    context.beginPath()
    context.moveTo(vertices[3].x, vertices[3].y)
    for (const v of vertices) {
      context.lineTo(v.x, v.y)
    }
    context.stroke()
  }

  private picturePosForEvent(e: PointerEvent) {
    if (!this.picture) {
      return new Vec2()
    }
    const {left, top, width, height} = this.minimap.getBoundingClientRect()
    return new Vec2(e.offsetX - left - width / 2, e.offsetY - top - height / 2).divScalar(this.picture.navigatorThumbnailScale).floor()
  }

  private onPointerDown = (e: PointerEvent) => {
    this.dragging = true
    if (!this.picture) {
      return
    }
    this.minimap.setPointerCapture(e.pointerId)
    this.dragStartPos = this.picturePosForEvent(e)
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
    const size = 128 * devicePixelRatio
    return (
      <PointerEvents onPointerDown={this.onPointerDown} onPointerMove={this.onPointerMove} onPointerUp={this.onPointerUp}>
        <canvas className="Navigator_minimap" width={size} height={size} ref={e => this.minimap = e} />
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
      picture.navigation.rotation = parseInt((ev.target as HTMLInputElement).value) / 180 * Math.PI
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
    const rotationDeg = Math.round(rotation / Math.PI * 180)

    return (
      <div className="Navigator">
        <NavigatorMinimap />
        <div>
          Scale: <input type="number" max={1600} onChange={this.onScaleChange} value={Math.round(scale * 100)} />
        </div>
        <div>
          Rotation: <input type="number" min={-180} max={180} onChange={this.onRotationChange} value={rotationDeg} />
        </div>
        <div>
          <label><input type="checkbox" checked={horizontalFlip} onChange={this.onHorizontalFlipChange} />Flip Horizontally</label>
        </div>
      </div>
    )
  }
}
