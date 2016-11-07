import * as React from "react"
import {reaction, observable, computed, action} from "mobx"
import {observer} from "mobx-react"
import {Vec2, Rect, Transform} from "paintvec"
import {TextureDrawTarget, Color} from "paintgl"
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import TiledTexture, {Tile, TiledTextureRawData} from "../models/TiledTexture"
import {TileBlender} from "../models/LayerBlender"
import Waypoint from "../models/Waypoint"
import Tool from './Tool'
import {context} from "../GLContext"
import {AppState} from "../state/AppState"
import {frameDebounce} from "../../lib/Debounce"
import {TransformLayerCommand} from "../commands/LayerCommand"

@observer
class TransformLayerOverlayUI extends React.Component<{tool: TransformLayerTool}, {}> {
  render() {
    const {tool} = this.props
    const {boundingRect} = tool

    if (!boundingRect) {
      return <g />
    }

    const transformPos = (pos: Vec2) => {
      return pos
        .transform(tool.transform)
        .transform(tool.renderer.transformFromPicture)
        .divScalar(devicePixelRatio)
    }

    const {topLeft, topRight, bottomLeft, bottomRight} = boundingRect
    const polygonPoints = [topLeft, topRight, bottomRight, bottomLeft]
      .map(transformPos)
      .map(v => `${v.x},${v.y}`).join(" ")
    const handlePositions = [
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
      topLeft.add(topRight).divScalar(2),
      topRight.add(bottomRight).divScalar(2),
      bottomRight.add(bottomLeft).divScalar(2),
      bottomLeft.add(topLeft).divScalar(2),
    ].map(transformPos)
    return (
      <g>
        <polygon points={polygonPoints} stroke="#888" fill="transparent" />
        {handlePositions.map((pos, i) => <circle key={i} cx={pos.x} cy={pos.y} r="4" stroke="#888" fill="#FFF" />)}
      </g>
    )
  }
}

const transformedTile = new Tile()
const transformedDrawTarget = new TextureDrawTarget(context, transformedTile.texture)

enum DragType {
  None,
  Translate,
  MoveTopLeft,
  MoveTopCenter,
  MoveTopRight,
  MoveCenterRight,
  MoveBottomRight,
  MoveBottomCenter,
  MoveBottomLeft,
  MoveCenterLeft,
  Rotate,
}

export default
class TransformLayerTool extends Tool {
  name = "Move"

  dragType = DragType.None
  originalPos = new Vec2()
  originalTranslation = new Vec2()
  @observable translation = new Vec2()
  @observable scale = new Vec2(1)
  @observable boundingRect: Rect|undefined
  originalTiledTexture = new TiledTexture()
  oldTransform = new Transform()

  constructor(appState: AppState) {
    super(appState)
    reaction(() => this.currentContent, () => this.onCurrentContentChange())
    reaction(() => this.picture && this.picture.lastUpdate, () => this.onCurrentContentChange())
  }

  onCurrentContentChange() {
    const content = this.currentContent
    if (content) {
      this.boundingRect = content && content.tiledTexture.boundingRect()
      this.originalTiledTexture = content.tiledTexture.clone()
      this.oldTransform = new Transform()
    }
  }

  @computed get transform() {
    if (!this.boundingRect) {
      return new Transform()
    }
    return Transform.translate(this.boundingRect.center.neg())
      .scale(this.scale)
      .translate(this.translation.add(this.boundingRect.center))
  }

  @computed get currentContent() {
    const {active, currentLayer} = this
    if (active && currentLayer && currentLayer.content.type == "image") {
      return currentLayer.content
    }
  }

  @action start(waypoint: Waypoint, rendererPos: Vec2) {
    if (!this.boundingRect) {
      this.dragType = DragType.None
      return
    }
    const pos = this.originalPos = waypoint.pos.round()
    this.originalTranslation = this.translation

    const {topLeft, topRight, bottomLeft, bottomRight} = this.boundingRect

    const handlePoints = new Map<DragType, Vec2>([
      [DragType.MoveTopLeft, topLeft],
      [DragType.MoveTopCenter, topLeft.add(topRight).divScalar(2)],
      [DragType.MoveTopRight, topRight],
      [DragType.MoveCenterRight, topRight.add(bottomRight).divScalar(2)],
      [DragType.MoveBottomRight, bottomRight],
      [DragType.MoveBottomCenter, bottomRight.add(bottomLeft).divScalar(2)],
      [DragType.MoveBottomLeft, bottomLeft],
      [DragType.MoveCenterLeft, bottomLeft.add(topLeft).divScalar(2)],
    ])

    for (const [dragType, handlePos] of handlePoints) {
      if (pos.sub(handlePos).length() <= 4 * devicePixelRatio) {
        this.dragType = dragType
        return
      }
    }
    if (this.boundingRect.includes(pos)) {
      this.dragType = DragType.Translate
    } else {
      this.dragType = DragType.Rotate
    }
  }

  @action move(waypoint: Waypoint, rendererPos: Vec2) {
    if (!this.boundingRect) {
      return
    }

    const pos = waypoint.pos.round()
    const offset = pos.sub(this.originalPos)

    switch (this.dragType) {
    case DragType.None:
      return
    case DragType.Translate:
      this.translation = offset.add(this.originalTranslation)
      break
    case DragType.MoveTopLeft:
      console.log("move topleft")
      const {topLeft, bottomRight} = this.boundingRect
      this.resizeRect(new Rect(topLeft.add(offset), bottomRight))
      break
    }
    this.update()
  }

  resizeRect(newRect: Rect) {
    if (!this.boundingRect) {
      return
    }
    this.scale = newRect.size.div(this.boundingRect.size)
    this.translation = newRect.center.sub(this.boundingRect.center)
  }

  update = frameDebounce(() => {
    if (this.picture) {
      this.picture.layerBlender.render()
      this.renderer.render()
    }
  })

  end() {
    this.dragType = DragType.None
    this.commit()
    this.translation = new Vec2()
    this.scale = new Vec2(1)
  }

  renderOverlayUI() {
    return <TransformLayerOverlayUI tool={this} />
  }

  commit() {
    if (this.picture && this.currentContent) {
      const command = new TransformLayerCommand(this.picture, this.currentContent.layer.path(), this.originalTiledTexture, this.oldTransform, this.transform)
      this.oldTransform = this.transform
      this.picture.undoStack.redoAndPush(command)
      this.boundingRect = this.currentContent.tiledTexture.boundingRect()
    }
  }

  hookLayerBlend(layer: Layer, tileKey: Vec2, tile: Tile|undefined, tileBlender: TileBlender) {
    const content = this.currentContent
    if (this.dragType != DragType.None && content && layer == content.layer) {
      transformedDrawTarget.clear(new Color(0,0,0,0))
      content.tiledTexture.drawToDrawTarget(transformedDrawTarget, {offset: tileKey.mulScalar(-Tile.width), blendMode: "src", transform: this.transform})
      const {blendMode, opacity} = layer
      tileBlender.blend(transformedTile, blendMode, opacity)
      return true
    } else {
      return false
    }
  }
}

