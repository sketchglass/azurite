import {Vec2, Rect, Transform} from "paintvec"
import {ShapeModel, TextureDrawTarget, Shape}  from "paintgl"
import {Waypoint} from "../Waypoint"
import {context} from "../../GLContext"
import TiledTexture, {Tile} from "../../models/TiledTexture"
import {appState} from "../../app/AppState"
import {DabRenderer} from "../DabRenderer"
import {ImageLayer} from "../../models/Layer"
import {BrushPresetPen} from "./BrushPresetPen"

const brushShader = {
  vertex: `
    uniform float uBrushSize;
    uniform float uMinWidthRatio;
    uniform float uOpacity;
    uniform vec2 uPictureSize;

    attribute vec2 aCenter;

    varying float vRadius;
    varying float vOpacity;
    varying vec2 vOffset;
    varying vec2 vSelectionUV;

    void vertexMain(vec2 pos, vec2 uv) {
      vSelectionUV = pos / uPictureSize;
      vOffset = pos - aCenter;

      float brushSize = uBrushSize * (uMinWidthRatio + (1.0 - uMinWidthRatio) * uv.x);
      float radius = brushSize * 0.5;
      vRadius = radius;

      // transparency = (overlap count) √ (final transparency)
      vOpacity = 1.0 - pow(1.0 - min(uOpacity, 0.998), 1.0 / brushSize);
    }
  `,
  fragment: `
    uniform float uBrushSize;
    uniform float uSoftness;
    uniform vec4 uColor;
    uniform bool uHasSelection;
    uniform sampler2D uSelection;

    varying float vRadius;
    varying float vOpacity;
    varying vec2 vOffset;
    varying vec2 vSelectionUV;

    void fragmentMain(vec2 pos, vec2 uv, out vec4 outColor) {
      float r = length(vOffset);
      float opacity = smoothstep(vRadius, vRadius - max(1.0, vRadius * uSoftness), r);
      vec4 color = uColor * opacity * vOpacity;
      if (uHasSelection) {
        outColor = color * texture2D(uSelection, vSelectionUV).a;
      } else {
        outColor = color;
      }
    }
  `
}

export
class DabRendererPen extends DabRenderer {
  private shape: Shape
  private model: ShapeModel
  private drawTarget = new TextureDrawTarget(context)
  readonly title = "Brush"

  constructor(public preset: BrushPresetPen) {
    super(preset)
    this.shape = new Shape(context)
    this.shape.setVec2Attributes("aCenter", [])
    this.model = new ShapeModel(context, {shape: this.shape, shader: brushShader})
  }

  start(layer: ImageLayer) {
    const {preset} = this
    this.model.uniforms = {
      uPictureSize: layer.picture.size,
      uBrushSize: preset.width,
      uColor: appState.color.toRgb(),
      uOpacity: preset.opacity,
      uMinWidthRatio: preset.minWidthRatio,
      uSoftness: preset.softness,
      uHasSelection: layer.picture.selection.hasSelection,
      uSelection: layer.picture.selection.texture,
    }
    return super.start(layer)
  }

  renderWaypoints(waypoints: Waypoint[], rect: Rect) {
    const {layer} = this
    if (!layer) {
      return
    }

    const relIndices = [
      0, 1, 2,
      2, 3, 0
    ]

    const positions: Vec2[] = []
    const texCoords: Vec2[] = []
    const centers: Vec2[] = []
    const indices: number[] = []

    const halfRectSize = new Vec2((this.preset.width + 2) / 2)

    for (let i = 0; i < waypoints.length; ++i) {
      const {pos, pressure} = waypoints[i]

      const rect = new Rect(pos.sub(halfRectSize), pos.add(halfRectSize))
      positions.push(...rect.vertices())

      const texCoord = new Vec2(pressure, 0) // use to pass pressure
      texCoords.push(texCoord, texCoord, texCoord, texCoord)

      centers.push(pos, pos, pos, pos)

      indices.push(...relIndices.map(j => j + i * 4))
    }
    this.shape.positions = positions
    this.shape.texCoords = texCoords
    this.shape.setVec2Attributes("aCenter", centers)
    this.shape.indices = indices

    this.model.blendMode = this.preset.eraser ? "dst-out" : (layer.preserveOpacity ? "src-atop" : "src-over")

    for (const key of TiledTexture.keysForRect(rect)) {
      const tile = this.prepareTile(key)
      if (!tile) {
        continue
      }
      this.drawTarget.texture = tile.texture
      this.model.transform = Transform.translate(key.mulScalar(-Tile.width))
      this.drawTarget.draw(this.model)
    }
  }
}
