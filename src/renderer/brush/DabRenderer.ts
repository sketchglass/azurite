import {reaction} from "mobx"
import {Rect, Vec2, Transform} from "paintvec"
import {ShapeModel, TextureDrawTarget, Shape, RectShape, Texture}  from "paintgl"
import {context} from "../GLContext"
import {drawTexture} from "../GLUtil"
import Layer, {ImageLayer} from "../models/Layer"
import TiledTexture, {Tile} from "../models/TiledTexture"
import {ChangeLayerImageCommand} from "../commands/LayerCommand"
import {renderer} from "../views/Renderer"
import {Waypoint} from "./Waypoint"
import {BrushPreset} from "./BrushPreset"
import {appState} from "../app/AppState"

const brushShader = {
  vertex: `
    uniform float uBrushSize;
    uniform float uMinWidthRatio;
    uniform float uOpacity;
    uniform float uMinOpacityRatio;
    uniform vec2 uPictureSize;

    attribute vec2 aCenter;

    varying float vRadius;
    varying float vOpacity;
    varying vec2 vOffset;
    varying vec2 vSelectionUV;

    void vertexMain(vec2 pos, vec2 uv) {
      vSelectionUV = pos / uPictureSize;
      vOffset = pos - aCenter;
      float pressure = uv.x;

      float brushSize = uBrushSize * mix(uMinWidthRatio, 1.0, pressure);
      float radius = brushSize * 0.5;
      vRadius = radius;

      float opacity = uOpacity * mix(uMinOpacityRatio, 1.0, pressure);
      // transparency = (overlap count) √ (final transparency)
      vOpacity = 1.0 - pow(1.0 - min(opacity, 0.998), 1.0 / brushSize);
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

enum ShapeClipModes {
  Shape, Clip
}

const shapeClipShader = {
  vertex: `
    uniform vec2 uBrushPos;
    uniform float uSampleSize;
    uniform float uPressure;
    uniform float uMinWidthRatio;
    uniform float uBrushRadius;
    uniform vec2 uPictureSize;
    varying vec2 vOffset;
    varying float vRadius;
    varying vec2 vSelectionUV;

    void vertexMain(vec2 pos, vec2 uv) {
      vRadius = uBrushRadius * (uMinWidthRatio + (1.0 - uMinWidthRatio) * uPressure);
      vOffset = pos - uSampleSize * 0.5;
      vSelectionUV = (vOffset + floor(uBrushPos)) / uPictureSize;
    }
  `,
  fragment: `
    uniform vec2 uBrushPos;
    uniform float uSoftness;
    uniform sampler2D uOriginalTexture;
    uniform float uMode;
    uniform bool uPreserveOpacity;
    uniform bool uHasSelection;
    uniform sampler2D uSelection;

    varying vec2 vOffset;
    varying float vRadius;
    varying vec2 vSelectionUV;

    vec4 fetchOriginal(vec2 uv) {
      return texture2D(uOriginalTexture, uv);
    }

    float calcOpacity(float r) {
      return smoothstep(vRadius, vRadius - max(1.0, vRadius * uSoftness), r);
    }

    void fragmentMain(vec2 pos, vec2 uv, out vec4 color) {
      float r = distance(fract(uBrushPos), vOffset);
      float opacity = calcOpacity(r);
      vec4 original = fetchOriginal(uv);
      if (uMode == ${ShapeClipModes.Shape}.0) {
        float clip = 1.0;
        if (uPreserveOpacity) {
          clip *= original.a;
        }
        if (uHasSelection) {
          clip *= texture2D(uSelection, vSelectionUV).a;
        }
        color = vec4(opacity * clip);
      } else {
        color = original * opacity;
      }
    }
  `
}

const watercolorShader = {
  vertex: `
    uniform float uSampleSize;
    uniform mediump float uPressure;
    uniform mediump float uOpacity;
    uniform sampler2D uShapeClipTexture;

    varying vec4 vMixColor;

    vec4 calcMixColor() {
      float topLod = log2(uSampleSize);
      vec4 sampleAverage = texture2DLod(uShapeClipTexture, vec2(0.75, 0.5), topLod);
      vec4 shapeAverage = texture2DLod(uShapeClipTexture, vec2(0.25, 0.5),  topLod);
      if (shapeAverage.a < 0.001) {
        return vec4(0.0);
      }
      return sampleAverage / shapeAverage.a;
    }

    void vertexMain(vec2 pos, vec2 uv) {
      vMixColor = calcMixColor();
    }
  `,
  fragment: `
    precision mediump float;

    uniform float uBlending;
    uniform float uOpacity;
    uniform float uPressure;
    uniform vec4 uColor;
    uniform bool uPreserveOpacity;

    uniform sampler2D uOriginalTexture;
    uniform sampler2D uShapeClipTexture;

    varying vec4 vMixColor;

    void fragmentMain(vec2 pos, vec2 uv, out vec4 outColor) {
      float mask = texture2D(uShapeClipTexture, uv * vec2(0.5, 1.0)).a * uPressure;
      vec4 orig = texture2D(uOriginalTexture, uv);

      float mixRate = mask * uBlending;

      vec4 mixColor = vMixColor;
      if (uPreserveOpacity) {
        mixColor *= orig.a;
      }
      // mix color
      vec4 color = mix(orig, mixColor, mixRate);
      // add color
      vec4 addColor = uColor * (mask * uOpacity);

      outColor = addColor + color * (1.0 - addColor.a);
    }
  `
}

export class DabRenderer {
  layer: ImageLayer|undefined
  private newTiledTexture = new TiledTexture()
  private editedRect: Rect|undefined
  private clearCommitTimeout: (() => void)|undefined
  private disconnectPicture: (() => void)|undefined

  private brushShape: Shape
  private brushModel: ShapeModel
  private drawTarget = new TextureDrawTarget(context)
  private dabShape = new RectShape(context, {rect: new Rect()})
  private mixModel = new ShapeModel(context, {shape: this.dabShape, blendMode: "src", shader: watercolorShader})
  private originalTexture = new Texture(context, {pixelType: "half-float"})
  private originalDrawTarget = new TextureDrawTarget(context, this.originalTexture)
  private shapeClipTexture = new Texture(context, {pixelType: "half-float", filter: "mipmap-nearest"})
  private shapeClipDrawTarget = new TextureDrawTarget(context, this.shapeClipTexture)
  private shapeClipModel = new ShapeModel(context, {shape: this.dabShape, blendMode: "src", shader: shapeClipShader})

  private sampleSize = 0

  constructor(public preset: BrushPreset) {
    this.brushShape = new Shape(context)
    this.brushShape.setVec2Attributes("aCenter", [])
    this.brushModel = new ShapeModel(context, {shape: this.brushShape, shader: brushShader})
    setImmediate(() => {
      reaction(() => appState.currentPicture, picture => {
        if (this.disconnectPicture) {
          this.disconnectPicture()
        }
        if (picture) {
          const beforeUndoRedo = () => {
            this.commit()
          }
          picture.undoStack.on("beforeUndo", beforeUndoRedo)
          picture.undoStack.on("beforeRedo", beforeUndoRedo)
          this.disconnectPicture = () => {
            picture.undoStack.removeListener("beforeUndo", beforeUndoRedo)
            picture.undoStack.removeListener("beforeRedo", beforeUndoRedo)
          }
        }
      })
    })
  }

  dispose() {
    if (this.disconnectPicture) {
      this.disconnectPicture()
    }
  }

  private addEditedRect(rect: Rect) {
    if (this.editedRect) {
      this.editedRect = this.editedRect.union(rect)
    } else {
      this.editedRect = rect
    }
  }

  private renderRect(rect: Rect) {
    if (!this.layer) {
      return
    }
    const {picture} = this.layer
    picture.blender.dirtiness.addRect(rect)
    renderer.addPictureDirtyRect(rect)
    renderer.renderNow()
  }

  private rectForWaypoints(waypoints: Waypoint[]) {
    const rectWidth = this.preset.width + 2
    const rectSize = new Vec2(rectWidth)
    const rects = waypoints.map(w => {
      const topLeft = new Vec2(w.pos.x - rectWidth * 0.5, w.pos.y - rectWidth * 0.5)
      return new Rect(topLeft, topLeft.add(rectSize))
    })
    return Rect.union(...rects)!.intBounding()
  }

  previewLayerTile(layer: Layer, tileKey: Vec2) {
    if (this.layer && layer == this.layer) {
      if (this.newTiledTexture.has(tileKey)) {
        return {tile: this.newTiledTexture.get(tileKey)}
      } else if (this.layer.tiledTexture.has(tileKey)) {
        return {tile: this.layer.tiledTexture.get(tileKey)}
      } else {
        return {tile: undefined}
      }
    }
  }

  get blendingEnabled() {
    return this.preset.type == "normal" && this.preset.blending > 0
  }

  start(layer: ImageLayer) {
    if (this.clearCommitTimeout) {
      this.clearCommitTimeout()
      this.clearCommitTimeout = undefined
    }
    if (this.layer != layer) {
      this.commit()
      this.layer = layer
    }
    const {preset} = this
    if (this.blendingEnabled) {
      this.sampleSize = Math.pow(2, Math.ceil(Math.log2(preset.width + 2)))

      this.mixModel.uniforms = {
        uSampleSize: this.sampleSize,
        uBlending: preset.blending,
        uColor: appState.color.toRgb(),
        uOpacity: preset.opacity,
        uPreserveOpacity: layer.preserveOpacity,
      }

      this.shapeClipModel.uniforms = {
        uPictureSize: layer.picture.size,
        uSampleSize: this.sampleSize,
        uBrushRadius: preset.width * 0.5,
        uSoftness: preset.softness,
        uMinWidthRatio: preset.minWidthRatio,
        uPreserveOpacity: layer.preserveOpacity,
        uHasSelection: layer.picture.selection.hasSelection,
        uSelection: layer.picture.selection.texture,
      }

      this.originalTexture.size = new Vec2(this.sampleSize)
      this.shapeClipTexture.size = new Vec2(this.sampleSize * 2, this.sampleSize)
      this.dabShape.rect = new Rect(new Vec2(), new Vec2(this.sampleSize))
    } else {
      this.brushModel.uniforms = {
        uPictureSize: layer.picture.size,
        uBrushSize: preset.width,
        uColor: appState.color.toRgb(),
        uOpacity: preset.opacity,
        uMinWidthRatio: preset.minWidthRatio,
        uMinOpacityRatio: preset.minOpacityRatio,
        uSoftness: preset.softness,
        uHasSelection: layer.picture.selection.hasSelection,
        uSelection: layer.picture.selection.texture,
      }
    }
  }

  nextWaypoints(waypoints: Waypoint[]) {
    const rect = this.rectForWaypoints(waypoints)
    this.renderWaypoints(waypoints, rect)
    this.addEditedRect(rect)
    this.renderRect(rect)
  }

  private commit() {
    const rect = this.editedRect
    if (!rect) {
      return
    }
    this.editedRect = undefined

    const {layer} = this
    if (!layer) {
      return
    }
    this.layer = undefined
    const {picture} = layer
    const command = new ChangeLayerImageCommand(picture, layer.path, "Brush", this.newTiledTexture, rect)
    this.newTiledTexture = new TiledTexture()
    picture.undoStack.push(command)
  }

  private setCommitTimeout() {
    let idleHandle: any
    const onCommit = () => {
      idleHandle = requestIdleCallback(() => {
        this.commit()
      })
    }
    const timeoutHandle = setTimeout(onCommit, appState.undoGroupingInterval)

    this.clearCommitTimeout = () => {
      clearTimeout(timeoutHandle)
      if (idleHandle != undefined) {
        cancelIdleCallback(idleHandle)
      }
    }
  }

  endWaypoint() {
    this.setCommitTimeout()
  }

  renderWaypoints(waypoints: Waypoint[], rect: Rect) {
    const {layer} = this
    if (!layer) {
      return
    }
    if (this.blendingEnabled) {
      for (let i = 0; i < waypoints.length; ++i) {
        const waypoint = waypoints[i]
        this.shapeClipModel.uniforms["uBrushPos"] = waypoint.pos
        this.shapeClipModel.uniforms["uPressure"] = waypoint.pressure
        this.mixModel.uniforms["uPressure"] = waypoint.pressure

        const topLeft = waypoint.pos.floor().sub(new Vec2(this.sampleSize / 2))

        for (const key of TiledTexture.keysForRect(rect)) {
          const tile = this.prepareTile(key)
          if (!tile) {
            continue
          }
          const offset = key.mulScalar(Tile.width).sub(topLeft)
          drawTexture(this.originalDrawTarget, tile.texture, {blendMode: "src", transform: Transform.translate(offset)})
        }

        this.shapeClipModel.uniforms["uOriginalTexture"] = this.originalTexture

        // draw brush shape in left of sample texture
        this.shapeClipModel.uniforms["uMode"] = ShapeClipModes.Shape
        this.shapeClipModel.transform = new Transform()
        this.shapeClipDrawTarget.draw(this.shapeClipModel)

        // draw original colors clipped by brush shape in right of sample texture
        this.shapeClipModel.uniforms["uMode"] = ShapeClipModes.Clip
        this.shapeClipModel.transform = Transform.translate(new Vec2(this.sampleSize, 0))
        this.shapeClipDrawTarget.draw(this.shapeClipModel)

        this.shapeClipTexture.generateMipmap()

        this.mixModel.uniforms["uOriginalTexture"] = this.originalTexture
        this.mixModel.uniforms["uShapeClipTexture"] = this.shapeClipTexture

        for (const key of TiledTexture.keysForRect(rect)) {
          const tile = this.prepareTile(key)
          if (!tile) {
            continue
          }
          this.drawTarget.texture = tile.texture
          this.mixModel.transform = Transform.translate(topLeft.sub(key.mulScalar(Tile.width)))
          this.drawTarget.draw(this.mixModel)
        }
      }
    } else {
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
      this.brushShape.positions = positions
      this.brushShape.texCoords = texCoords
      this.brushShape.setVec2Attributes("aCenter", centers)
      this.brushShape.indices = indices

      this.brushModel.blendMode = this.preset.type == "eraser" ? "dst-out" : (layer.preserveOpacity ? "src-atop" : "src-over")

      for (const key of TiledTexture.keysForRect(rect)) {
        const tile = this.prepareTile(key)
        if (!tile) {
          continue
        }
        this.drawTarget.texture = tile.texture
        this.brushModel.transform = Transform.translate(key.mulScalar(-Tile.width))
        this.drawTarget.draw(this.brushModel)
      }
    }
  }

  protected prepareTile(key: Vec2) {
    if (!this.layer) {
      return
    }
    if (this.newTiledTexture.has(key)) {
      return this.newTiledTexture.get(key)
    } else if (this.layer.tiledTexture.has(key)) {
      const tile = this.layer.tiledTexture.get(key).clone()
      this.newTiledTexture.set(key, tile)
      return tile
    } else {
      const tile = new Tile()
      this.newTiledTexture.set(key, tile)
      return tile
    }
  }
}
