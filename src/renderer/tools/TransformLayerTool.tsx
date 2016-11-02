import * as React from "react"
import {reaction, observable, computed} from "mobx"
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
  @observable boundingRect: Rect|undefined

  constructor(appState: AppState) {
    super(appState)
    reaction(() => this.currentContent, content => {
      this.boundingRect = content && content.tiledTexture.boundingRect()
    })
    reaction(() => this.picture && this.picture.lastUpdate, update => {
      const content = this.currentContent
      if (update && content) {
        this.boundingRect = content && content.tiledTexture.boundingRect()
      }
    })
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

  start(waypoint: Waypoint, rendererPos: Vec2) {
    this.originalPos = rendererPos.round()
    this.originalTranslation = this.translation
    this.dragging = true
  }

  move(waypoint: Waypoint, rendererPos: Vec2) {
    if (this.dragging) {
      this.translation = rendererPos.round().sub(this.originalPos).add(this.originalTranslation)
      this.update()
    }
  }

  update = frameDebounce(() => {
    if (this.picture) {
      this.picture.layerBlender.render()
      this.renderer.render()
    }
  })

  end() {
    this.dragging = false
    this.commit()
    this.translation = new Vec2()
  }

  renderOverlayUI() {
    return <TransformLayerOverlayUI tool={this} />
  }

  commit() {
    if (this.picture && this.currentContent && this.boundingRect) {
      const command = new TransformLayerCommand(this.picture, this.currentContent.layer.path(), this.boundingRect, this.transform)
      this.picture.undoStack.redoAndPush(command)
      this.boundingRect = this.currentContent.tiledTexture.boundingRect()
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
class TransformLayerCommand {
  oldTiledTextureData: TiledTextureRawData

  constructor(public picture: Picture, public path: number[], public boundingRect: Rect, public transform: Transform) {
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
    content.tiledTexture = TiledTexture.fromRawData(this.oldTiledTextureData)
    newTiles.dispose()

    this.picture.lastUpdate = {layer: content.layer}
  }

  redo() {
    const {content} = this
    if (!content) {
      return
    }

    const tiledTexture = new TiledTexture()
    const rect = this.boundingRect.transform(this.transform)

    const drawTarget = new TextureDrawTarget(context)

    for (const key of TiledTexture.keysForRect(rect)) {
      const tile = new Tile()
      drawTarget.texture = tile.texture
      content.tiledTexture.drawToDrawTarget(drawTarget, {offset: key.mulScalar(-Tile.width), blendMode: "src", transform: this.transform})
      tiledTexture.set(key, tile)
    }

    const oldTiledTexture = content.tiledTexture
    this.oldTiledTextureData = oldTiledTexture.toRawData()
    content.tiledTexture = tiledTexture
    oldTiledTexture.dispose()

    this.picture.lastUpdate = {layer: content.layer}
  }
}
