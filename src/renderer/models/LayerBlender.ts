import Picture from "./Picture"
import {Vec2, Rect, Transform} from "paintvec"
import {Model, Texture, TextureDrawTarget, Shader, TextureShader, RectShape, PixelType, Color} from "paintgl"
import {context} from "../GLContext"
import TiledTexture, {Tile} from "./TiledTexture"
import Layer, {LayerBlendMode} from "./Layer"
import {drawTexture} from "../GLUtil"

class NormalBlendShader extends Shader {
  get fragmentShader() {
    return `
      precision mediump float;
      varying highp vec2 vTexCoord;
      uniform sampler2D srcTexture;
      uniform float opacity;
      void main(void) {
        gl_FragColor = texture2D(srcTexture, vTexCoord) * opacity;
      }
    `
  }
}

abstract class BlendShader extends Shader {
  abstract get blendOp(): string

  get fragmentShader() {
    return `
      precision mediump float;
      varying highp vec2 vTexCoord;
      uniform sampler2D srcTexture;
      uniform sampler2D dstTexture;
      uniform float opacity;
      vec3 blendOp(vec3 src, vec3 dst) {
        ${this.blendOp}
      }
      vec3 getColor(vec4 pixel) {
        return pixel.a == 0.0 ? vec3(0.0) : pixel.rgb / pixel.a;
      }
      void main(void) {
        vec4 src = texture2D(srcTexture, vTexCoord) * opacity;
        vec4 dst = texture2D(dstTexture, vTexCoord);
        vec4 blended = vec4(clamp(blendOp(getColor(src), getColor(dst)), 0.0, 1.0), 1.0);
        gl_FragColor = blended * src.a * dst.a + src * (1.0 - dst.a) + dst * (1.0 - src.a);
      }
    `
  }
}

const blendOps = new Map<LayerBlendMode, string>([
  ["plus", `
    return src + dst;
  `],
  ["multiply", `
    return src * dst;
  `]
])

const tileShape = new RectShape(context, {
  rect: Tile.rect
})
const tileBlendModels = new Map(Array.from(blendOps).map(([type, op]) => {
  class shader extends BlendShader {
    get blendOp() {
      return op
    }
  }
  const model = new Model(context, {
    shape: tileShape,
    shader: shader,
    blendMode: "src",
  })
  return [type, model] as [LayerBlendMode, Model]
}))

const tileNormalModel = new Model(context, {
  shape: tileShape,
  shader: NormalBlendShader,
})

class TileBlender {
  tiles = [0, 1].map(i => new Tile())
  drawTargets = this.tiles.map(tile => new TextureDrawTarget(context, tile.texture))

  currentIndex = 0

  swapCurrent() {
    this.currentIndex = [1, 0][this.currentIndex]
  }

  get currentTile() {
    return this.tiles[this.currentIndex]
  }
  get currentDrawTarget() {
    return this.drawTargets[this.currentIndex]
  }
  get previousTile() {
    return this.tiles[[1, 0][this.currentIndex]]
  }
  get previousDrawTarget() {
    return this.drawTargets[[1, 0][this.currentIndex]]
  }

  blend(tile: Tile, mode: LayerBlendMode, opacity: number) {
    const model = tileBlendModels.get(mode)
    if (model) {
      this.swapCurrent()
      model.uniforms = {
        srcTexture: tile.texture,
        dstTexture: this.previousTile.texture,
        opacity
      }
      this.currentDrawTarget.draw(model)
    } else {
      tileNormalModel.uniforms = {
        srcTexture: tile.texture,
        opacity
      }
      this.currentDrawTarget.draw(tileNormalModel)
    }
  }

  clear() {
    this.currentDrawTarget.clear(new Color(0, 0, 0, 0))
  }

  setScissor(rect: Rect|undefined) {
    for (const target of this.drawTargets) {
      target.scissor = rect
    }
  }
}

const tileBlenders = [new TileBlender()]

export default
class LayerBlender {
  blendedTexture = new Texture(context, {
    size: this.picture.size,
    pixelType: "half-float",
  })
  drawTarget = new TextureDrawTarget(context, this.blendedTexture)

  constructor(public picture: Picture) {
  }

  render(rect?: Rect) {
    this.drawTarget.scissor = rect
    this.drawTarget.clear(new Color(1, 1, 1, 1))
    const tileKeys = TiledTexture.keysForRect(rect || new Rect(new Vec2(0), this.picture.size))
    for (const key of tileKeys) {
      const offset = key.mulScalar(Tile.width)
      const tileScissor = rect
        ? new Rect(rect.topLeft.sub(offset), rect.bottomRight.sub(offset)).intersection(Tile.rect)
        : undefined
      this.renderLayers(this.picture.layers, key, tileScissor, 0)
      drawTexture(this.drawTarget, tileBlenders[0].currentTile.texture, {offset, blendMode: "src-over"})
    }
  }

  renderLayer(layer: Layer, key: Vec2, scissor: Rect|undefined, depth: number): boolean {
    if (!layer.visible) {
      return false
    }
    const {content} = layer
    let tile: Tile|undefined = undefined

    if (content.type == "image") {
      if (content.tiledTexture.has(key)) {
        tile = content.tiledTexture.get(key)
      }
    } else {
      const {children} = content
      const rendered = this.renderLayers(children, key, scissor, depth + 1)
      if (rendered) {
        tile = tileBlenders[depth + 1].currentTile
      }
    }

    if (!tile) {
      return false
    }
    tileBlenders[depth].blend(tile, layer.blendMode, layer.opacity)
    return true
  }

  renderLayers(layers: Layer[], key: Vec2, scissor: Rect|undefined, depth: number): boolean {
    if (!tileBlenders[depth]) {
      tileBlenders[depth] = new TileBlender()
    }
    tileBlenders[depth].setScissor(scissor)
    tileBlenders[depth].clear()
    let rendered = false
    for (let i = layers.length - 1; i >= 0; --i) {
      const childRendered = this.renderLayer(layers[i], key, scissor, depth)
      rendered = rendered || childRendered
    }
    return rendered
  }

  dispose() {
    this.drawTarget.dispose()
    this.blendedTexture.dispose()
  }
}
