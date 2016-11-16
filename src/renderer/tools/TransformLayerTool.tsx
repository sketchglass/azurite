import * as React from "react"
import {reaction, observable, computed, action} from "mobx"
import {observer} from "mobx-react"
import {Vec2, Rect, Transform} from "paintvec"
import {TextureDrawTarget, Color, Texture} from "paintgl"
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import TiledTexture, {Tile, TiledTextureRawData} from "../models/TiledTexture"
import {TileBlender} from "../models/LayerBlender"
import Waypoint from "../models/Waypoint"
import Tool, {ToolPointerEvent} from './Tool'
import {drawTexture} from "../GLUtil"
import {context} from "../GLContext"
import {AppState} from "../state/AppState"
import {frameDebounce} from "../../lib/Debounce"
import {TransformLayerCommand} from "../commands/LayerCommand"
import {UndoStack, UndoCommand} from "../models/UndoStack"

const HANDLE_RADIUS = 4

@observer
class TransformLayerOverlayUI extends React.Component<{tool: TransformLayerTool}, {}> {
  render() {
    const {tool} = this.props
    const {rect} = tool

    if (!rect) {
      return <g />
    }

    const transformPos = (pos: Vec2) => {
      return pos
        .transform(tool.additionalTransform)
        .transform(tool.renderer.transformFromPicture)
        .divScalar(devicePixelRatio)
    }

    const vertices = rect.vertices().map(transformPos)

    const polygonPoints = vertices.map(v => `${v.x},${v.y}`).join(" ")
    const [topLeft, topRight, bottomRight, bottomLeft] = vertices
    const handlePositions = [
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
      topLeft.add(topRight).divScalar(2),
      topRight.add(bottomRight).divScalar(2),
      bottomRight.add(bottomLeft).divScalar(2),
      bottomLeft.add(topLeft).divScalar(2),
    ]
    return (
      <g>
        <polygon points={polygonPoints} stroke="#888" fill="transparent" />
        {handlePositions.map((pos, i) => <circle key={i} cx={pos.x} cy={pos.y} r={HANDLE_RADIUS} stroke="#888" fill="#FFF" />)}
      </g>
    )
  }
}

const TransformLayerSettings = observer((props: {tool: TransformLayerTool}) => {
  const {tool} = props
  const onOK = () => tool.endEditing()
  const onCancel = () => tool.cancelEditing()
  return (
    <div className="TransformLayerSettings" hidden={!tool.editing}>
      <button className="Button Button-primary" onClick={onOK}>OK</button>
      <button className="Button" onClick={onCancel}>Cancel</button>
    </div>
  )
})

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

class TransformChangeCommand implements UndoCommand {
  constructor(
    public tool: TransformLayerTool,
    public oldRect: Rect, public oldAdditionalTransform: Transform,
    public newRect: Rect, public newAdditionalTransform: Transform
  ) {}

  title = "Change Transform"

  redo() {
    this.tool.rect = this.newRect
    this.tool.additionalTransform = this.newAdditionalTransform
    this.tool.update()
  }

  undo() {
    this.tool.rect = this.oldRect
    this.tool.additionalTransform = this.oldAdditionalTransform
    this.tool.update()
  }
}

export default
class TransformLayerTool extends Tool {
  name = "Move"

  dragType = DragType.None
  startMovePos = new Vec2()
  startAdditionalTransformPos = new Vec2()
  originalRect: Rect|undefined
  originalTexture: Texture|undefined
  lastRect: Rect|undefined
  lastQuad: [Vec2, Vec2, Vec2, Vec2]|undefined
  lastRatioWToH = 1
  lastRatioHToW = 1
  lastAdditionalTransform = new Transform()
  @observable rect: Rect|undefined
  @observable additionalTransform = new Transform()

  @observable editing = false
  @observable editUndoStack: UndoStack|undefined

  @computed get modal() {
    return this.editing
  }
  @computed get modalUndoStack() {
    return this.editUndoStack
  }

  constructor(appState: AppState) {
    super(appState)
    reaction(() => this.active, () => this.endEditing())
    reaction(() => [this.currentContent, this.active], () => this.reset())
    reaction(() => appState.currentPicture && appState.currentPicture.lastUpdate, () => this.reset())
  }

  reset() {
    const content = this.currentContent
    if (content && this.active) {
      this.originalRect = content.tiledTexture.boundingRect()
      if (this.originalRect) {
        const texture = this.originalTexture = new Texture(context, {size: this.originalRect.size})
        const drawTarget = new TextureDrawTarget(context, texture)
        content.tiledTexture.drawToDrawTarget(drawTarget, {offset: this.originalRect.topLeft.neg(), blendMode: "src"})
        drawTarget.dispose()
      } else {
        if (this.originalTexture) {
          this.originalTexture.dispose()
        }
        this.originalTexture = undefined
      }
      this.lastRect = this.rect = this.originalRect
      this.lastAdditionalTransform = this.additionalTransform = new Transform()
    }
  }

  @computed get additionalTransformInv() {
    return this.additionalTransform.invert() || new Transform()
  }

  @computed get transform() {
    if (!this.originalRect || !this.rect) {
      return new Transform()
    }
    const rectToRect = Transform.rectToRect(this.originalRect, this.rect) || new Transform()
    return rectToRect.merge(this.additionalTransform)
  }

  @computed get currentContent() {
    const {currentLayer} = this
    if (currentLayer && currentLayer.content.type == "image") {
      return currentLayer.content
    }
  }

  @action start(ev: ToolPointerEvent) {
    if (!this.rect || !this.picture) {
      this.dragType = DragType.None
      return
    }

    this.startEditing()

    const movePos = this.startMovePos = ev.picturePos.transform(this.additionalTransformInv).round()
    this.startAdditionalTransformPos = ev.picturePos

    this.lastRect = this.rect
    this.lastQuad = this.rect.vertices().map(v => v.transform(this.additionalTransform)) as [Vec2, Vec2, Vec2, Vec2]
    this.lastRatioWToH = this.rect.height / this.rect.width
    this.lastRatioHToW = this.rect.width / this.rect.height
    this.lastAdditionalTransform = this.additionalTransform

    const [topLeft, topRight, bottomRight, bottomLeft] = this.rect.vertices().map(
      v => v.transform(this.additionalTransform).transform(this.renderer.transformFromPicture)
    )

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
      if (ev.rendererPos.sub(handlePos).length() <= HANDLE_RADIUS * 1.5 * devicePixelRatio) {
        this.dragType = dragType
        return
      }
    }
    if (this.rect.includes(movePos)) {
      this.dragType = DragType.Translate
    } else {
      this.dragType = DragType.Rotate
    }
  }

  @action move(ev: ToolPointerEvent) {
    const movePos = ev.picturePos.transform(this.additionalTransformInv).round()
    const additionalTransformPos = ev.picturePos
    const offset = movePos.sub(this.startMovePos)
    if (!this.lastRect) {
      return
    }

    const keepRatio = ev.shiftKey
    const perspective = ev.ctrlKey || ev.metaKey

    switch (this.dragType) {
      case DragType.None:
        return
      case DragType.Translate:
        this.translateRect(offset)
        break
      case DragType.MoveTopLeft:
        if (perspective) {
          this.resizeQuad(0, additionalTransformPos)
        } else {
          this.resizeRect(-offset.x, -offset.y, new Vec2(0, 0), keepRatio)
        }
        break
      case DragType.MoveTopCenter:
        this.resizeRect(undefined, -offset.y, new Vec2(0.5, 0), keepRatio)
        break
      case DragType.MoveTopRight:
        if (perspective) {
          this.resizeQuad(1, additionalTransformPos)
        } else {
          this.resizeRect(offset.x, -offset.y, new Vec2(1, 0), keepRatio)
        }
        break
      case DragType.MoveCenterRight:
        this.resizeRect(offset.x, undefined, new Vec2(1, 0.5), keepRatio)
        break
      case DragType.MoveBottomRight:
        if (perspective) {
          this.resizeQuad(2, additionalTransformPos)
        } else {
          this.resizeRect(offset.x, offset.y, new Vec2(1, 1), keepRatio)
        }
        break
      case DragType.MoveBottomCenter:
        this.resizeRect(undefined, offset.y, new Vec2(0.5, 1), keepRatio)
        break
      case DragType.MoveBottomLeft:
        if (perspective) {
          this.resizeQuad(3, additionalTransformPos)
        } else {
          this.resizeRect(-offset.x, offset.y, new Vec2(0, 1), keepRatio)
        }
        break
      case DragType.MoveCenterLeft:
        this.resizeRect(-offset.x, undefined, new Vec2(0, 0.5), keepRatio)
        break
      case DragType.Rotate: {
        const center = this.lastRect.center.transform(this.lastAdditionalTransform)
        const origAngle = this.startAdditionalTransformPos.sub(center).angle()
        const angle = additionalTransformPos.sub(center).angle()
        let rotation = angle - origAngle
        if (keepRatio) {
          const deg45 = Math.PI * 0.25
          rotation = Math.round(rotation / deg45) * deg45
        }
        const rotationTransform = Transform.translate(center.neg()).rotate(rotation).translate(center)
        this.additionalTransform = this.lastAdditionalTransform.merge(rotationTransform)
        break
      }
    }
    this.update()
  }

  translateRect(offset: Vec2) {
    if (!this.lastRect) {
      return
    }
    const topLeft = this.lastRect.topLeft.add(offset)
    this.rect = new Rect(topLeft, topLeft.add(this.lastRect.size))
  }

  resizeRect(diffWidth: number|undefined, diffHeight: number|undefined, origin: Vec2, keepRatio: boolean) {
    if (!this.lastRect) {
      return
    }
    if (keepRatio) {
      const {width, height} = this.lastRect
      const newWidth = width + diffWidth
      const newHeight = height + diffHeight
      if (diffHeight == undefined || newWidth / width < newHeight / height) {
        diffHeight = newWidth * this.lastRatioWToH - height
      } else {
        diffWidth = newHeight * this.lastRatioHToW - width
      }
    }
    const diff = new Vec2(diffWidth || 0, diffHeight || 0)
    const topLeftDiff = diff.mul(new Vec2(1).sub(origin))
    const bottomRightDiff = diff.mul(origin)
    const {topLeft, bottomRight} = this.lastRect
    this.rect = new Rect(topLeft.sub(topLeftDiff), bottomRight.add(bottomRightDiff))
  }

  resizeQuad(vertexIndex: number, newVertex: Vec2) {
    if (!this.lastQuad) {
      return
    }
    const newQuad = [...this.lastQuad]
    newQuad[vertexIndex] = newVertex
    const transform = Transform.quadToQuad(this.lastQuad, newQuad as [Vec2, Vec2, Vec2, Vec2])
    if (!transform) {
      return
    }
    this.additionalTransform = this.lastAdditionalTransform.merge(transform)
  }

  update = frameDebounce(() => {
    if (this.picture) {
      this.picture.layerBlender.render()
      this.renderer.render()
    }
  })

  end() {
    this.dragType = DragType.None
    if (this.modalUndoStack && this.lastRect && this.rect) {
      const command = new TransformChangeCommand(
        this,
        this.lastRect, this.lastAdditionalTransform,
        this.rect, this.additionalTransform
      )
      this.modalUndoStack.redoAndPush(command)
    }
  }

  keyDown(ev: React.KeyboardEvent<HTMLElement>) {
    if (ev.key == "Enter") {
      this.endEditing()
    }
    if (ev.key == "Escape") {
      this.cancelEditing()
    }
  }

  startEditing() {
    if (!this.editing) {
      this.editing = true
      this.editUndoStack = new UndoStack()
    }
  }

  endEditing() {
    if (this.editing && this.picture && this.currentContent) {
      const command = new TransformLayerCommand(this.picture, this.currentContent.layer.path(), this.transform)
      this.picture.undoStack.redoAndPush(command)
    }
    this.cancelEditing()
  }

  cancelEditing() {
    if (this.editing) {
      this.reset()
      this.editing = false
      this.editUndoStack = undefined
      this.update()
    }
  }

  hookLayerBlend(layer: Layer, tileKey: Vec2, tile: Tile|undefined, tileBlender: TileBlender) {
    const content = this.currentContent
    if (this.editing && content && layer == content.layer && this.originalRect && this.originalTexture) {
      transformedDrawTarget.clear(new Color(0,0,0,0))
      const transform = Transform.translate(this.originalRect.topLeft)
        .merge(this.transform)
        .translate(tileKey.mulScalar(-Tile.width))
      drawTexture(transformedDrawTarget, this.originalTexture, {transform, blendMode: "src"})
      const {blendMode, opacity} = layer
      tileBlender.blend(transformedTile, blendMode, opacity)
      return true
    } else {
      return false
    }
  }

  renderOverlayUI() {
    return <TransformLayerOverlayUI tool={this} />
  }

  renderSettings() {
    return <TransformLayerSettings tool={this} />
  }
}

