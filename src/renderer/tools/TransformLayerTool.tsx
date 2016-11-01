import * as React from "react"
import {reaction, observable, computed} from "mobx"
import {observer} from "mobx-react"
import {Vec2, Rect, Transform} from "paintvec"
import {TextureDrawTarget, Color} from "paintgl"
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import TiledTexture, {Tile, TiledTextureData} from "../models/TiledTexture"
import {TileBlender} from "../models/LayerBlender"
import Waypoint from "../models/Waypoint"
import Tool from './Tool'
import {context} from "../GLContext"
import {AppState} from "../state/AppState"

@observer
class TransformLayerOverlayUI extends React.Component<{tool: TransformLayerTool}, {}> {
  render() {
    const {tool} = this.props
    const {boundingRect} = tool
    let polygon: JSX.Element|undefined = undefined
    if (boundingRect) {
      const {topLeft, topRight, bottomLeft, bottomRight} = boundingRect
      const points = [topLeft, topRight, bottomRight, bottomLeft]
        .map(v => v.transform(tool.transform).transform(tool.renderer.transformFromPicture).divScalar(devicePixelRatio))
        .map(v => `${v.x},${v.y}`).join(" ")
      polygon = <polygon points={points} stroke="#888" fill="transparent" />
    }
    return (
      <g>
        {polygon}
      </g>
    )
  }
}

const transformedTile = new Tile()
const transformedDrawTarget = new TextureDrawTarget(context, transformedTile.texture)

export default
class TransformLayerTool extends Tool {
  name = "Move"

  dragging = false
  originalPos = new Vec2()
  originalTranslation = new Vec2()
  @observable translation = new Vec2()

  needsUpdate = false

  constructor(appState: AppState) {
    super(appState)
  }

  get transform() {
    return Transform.translate(this.translation)
  }

  @computed get currentContent() {
    const {active, currentLayer} = this
    if (active && currentLayer && currentLayer.content.type == "image") {
      return currentLayer.content
    }
  }

  @computed get boundingRect() {
    if (this.currentContent) {
      return this.currentContent.tiledTexture.boundingRect()
    }
  }

  start(waypoint: Waypoint, rendererPos: Vec2) {
    this.originalPos = rendererPos
    this.originalTranslation = this.translation
    this.dragging = true
  }

  move(waypoint: Waypoint, rendererPos: Vec2) {
    if (this.dragging) {
      this.translation = rendererPos.sub(this.originalPos).add(this.originalTranslation)
      this.needsUpdate = true
      setImmediate(this.update)
    }
  }

  update = () => {
    if (this.needsUpdate) {
      // skip update when update takes so long and update queue is jammed
      this.needsUpdate = false
      if (this.picture) {
        this.picture.updated.next()
      }
    }
  }

  end() {
    this.dragging = false
    this.commit()
  }

  renderOverlayUI() {
    return <TransformLayerOverlayUI tool={this} />
  }

  commit() {
    if (this.picture && this.currentContent) {
      const command = new TransformlayerCommand(this.picture, this.currentContent.layer.path(), this.transform)
      this.picture.undoStack.redoAndPush(command)
    }
  }

  hookLayerBlend(layer: Layer, tileKey: Vec2, tile: Tile|undefined, tileBlender: TileBlender) {
    const content = this.currentContent
    if (this.dragging && content && layer == content.layer) {
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

export
class TransformlayerCommand {
  oldTiledTextureData: TiledTextureData

  constructor(public picture: Picture, public path: number[], public transform: Transform) {
  }

  get content() {
    const layer = this.picture.layerFromPath(this.path)
    if (!layer) {
      return
    }
    const {content} = layer
    if (content.type != "image") {
      return
    }
    return content
  }

  undo() {
    const {content} = this
    if (!content) {
      return
    }
    const newTiles = content.tiledTexture
    content.tiledTexture = TiledTexture.fromData(this.oldTiledTextureData)
    newTiles.dispose()

    this.picture.updated.next()
  }

  redo() {
    const {content} = this
    if (!content) {
      return
    }

    const oldRect = content.tiledTexture.boundingRect()
    if (!oldRect) {
      return // image is empty
    }
    const tiledTexture = new TiledTexture()
    const rect = oldRect.transform(this.transform)

    const drawTarget = new TextureDrawTarget(context)

    for (const key of TiledTexture.keysForRect(rect)) {
      const tile = new Tile()
      drawTarget.texture = tile.texture
      drawTarget.clear(new Color(0,0,0,0))
      content.tiledTexture.drawToDrawTarget(drawTarget, {offset: key.mulScalar(-Tile.width), blendMode: "src", transform: this.transform})
      tiledTexture.set(key, tile)
    }

    const oldTiledTexture = content.tiledTexture
    this.oldTiledTextureData = oldTiledTexture.toData()
    content.tiledTexture = tiledTexture
    oldTiledTexture.dispose()

    this.picture.updated.next()
  }
}
