import * as React from "react"
import {reaction, computed, action} from "mobx"
import {observer} from "mobx-react"
import {Vec2, Rect, Transform} from "paintvec"
import {TextureDrawTarget, Color, Texture} from "paintgl"
import Layer from "../models/Layer"
import {Tile} from "../models/TiledTexture"
import {ToolPointerEvent} from './Tool'
import {drawTexture} from "../GLUtil"
import {context} from "../GLContext"
import {AppState} from "../state/AppState"
import {TransformLayerCommand} from "../commands/LayerCommand"
import RectMoveTool, {DragType} from "./RectMoveTool"

const HANDLE_RADIUS = 4

const TransformLayerSettings = observer((props: {tool: TransformLayerTool}) => {
  const {tool} = props
  const onOK = () => tool.endEditing()
  const onCancel = () => tool.cancelEditing()
  return (
    <div className="TransformLayerSettings" hidden={!tool.modal}>
      <button className="Button Button-primary" onClick={onOK}>OK</button>
      <button className="Button" onClick={onCancel}>Cancel</button>
    </div>
  )
})

const transformedTile = new Tile()
const transformedDrawTarget = new TextureDrawTarget(context, transformedTile.texture)

export default
class TransformLayerTool extends RectMoveTool {
  name = "Move"

  handleRadius = HANDLE_RADIUS

  originalTexture: Texture|undefined
  originalTextureSubrect = new Rect()

  constructor(appState: AppState) {
    super(appState)
    reaction(() => this.active, () => this.endEditing())
    reaction(() => [this.currentContent, this.active], () => this.reset())
    reaction(() => appState.currentPicture && appState.currentPicture.lastUpdate, () => this.reset())
    reaction(() => this.transform, () => this.update())
  }

  reset() {
    const content = this.currentContent
    if (content && this.active) {
      const originalRect = content.tiledTexture.boundingRect()
      this.resetRect(originalRect)
      if (this.originalTexture) {
        this.originalTexture.dispose()
      }
      if (originalRect) {
        const inflation = 2
        const textureRect = originalRect.inflate(inflation)
        const texture = this.originalTexture = content.tiledTexture.cropToTexture(textureRect)
        this.originalTextureSubrect = new Rect(new Vec2(), textureRect.size).inflate(-inflation)
        texture.filter = "bilinear"
      } else {
        this.originalTexture = undefined
      }
    } else {
      this.resetRect()
    }
  }

  @computed get currentContent() {
    const {currentLayer} = this
    if (currentLayer && currentLayer.content.type == "image") {
      return currentLayer.content
    }
  }

  @action start(e: ToolPointerEvent) {
    super.start(e)
    if (this.dragType != DragType.None) {
      this.startEditing()
    }
  }

  @action keyDown(ev: React.KeyboardEvent<HTMLElement>) {
    super.keyDown(ev)
    if (ev.key == "Enter") {
      this.endEditing()
    }
    if (ev.key == "Escape") {
      this.cancelEditing()
    }
  }

  startEditing() {
    this.startModal()
  }

  endEditing() {
    if (this.modal && this.picture && this.currentContent && this.originalTexture && this.originalRect) {
      const command = new TransformLayerCommand(this.picture, this.currentContent.layer.path(), this.transform)
      this.picture.undoStack.redoAndPush(command)
    }
    this.cancelEditing()
  }

  cancelEditing() {
    this.endModal()
    this.reset()
  }

  update() {
    if (!this.picture || !this.renderer) {
      return
    }
    this.picture.layerBlender.wholeDirty = true
    this.renderer.wholeDirty = true
    this.renderer.update()
  }

  replaceTile(layer: Layer, tileKey: Vec2): {replaced: boolean, tile?: Tile} {
    const content = this.currentContent
    if (this.modal && content && layer == content.layer && this.originalRect && this.originalTexture) {
      transformedDrawTarget.clear(new Color(0, 0, 0, 0))
      const transform = Transform.translate(this.originalRect.topLeft)
        .merge(this.transform)
        .translate(tileKey.mulScalar(-Tile.width))
      drawTexture(transformedDrawTarget, this.originalTexture, {transform, blendMode: "src", bicubic: true, srcRect: this.originalTextureSubrect})
      return {replaced: true, tile: transformedTile}
    } else {
      return {replaced: false}
    }
  }

  renderSettings() {
    return <TransformLayerSettings tool={this} />
  }

  renderOverlayCanvas(context: CanvasRenderingContext2D) {
    if (!this.hasRect) {
      return
    }
    const {originalRect} = this

    const transformPos = (pos: Vec2) => {
      return pos
        .transform(this.transform)
        .transform(this.renderer.transformFromPicture)
    }

    const vertices = originalRect.vertices().map(transformPos)

    context.lineWidth = 1
    context.strokeStyle = "#888"
    context.beginPath()
    for (const [i, p] of vertices.entries()) {
      if (i == 0) {
        context.moveTo(p.x, p.y)
      } else {
        context.lineTo(p.x, p.y)
      }
    }
    context.closePath()
    context.stroke()

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

    const handleRadius = HANDLE_RADIUS * devicePixelRatio
    for (const handle of handlePositions) {
      context.strokeStyle = "#888"
      context.fillStyle = "#fff"
      context.beginPath()
      context.ellipse(handle.x, handle.y, handleRadius, handleRadius, 0, 0, 2 * Math.PI)
      context.fill()
      context.stroke()
    }
  }
}
