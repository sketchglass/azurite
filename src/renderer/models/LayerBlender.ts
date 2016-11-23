import {observable} from "mobx"
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

class MixShader extends Shader {
  get fragmentShader() {
    return `
      precision highp float;
      varying vec2 vTexCoord;
      uniform sampler2D textureA;
      uniform sampler2D textureB;
      uniform sampler2D textureRate;
      void main(void) {
        vec4 a = texture2D(textureA, vTexCoord);
        vec4 b = texture2D(textureB, vTexCoord);
        float rate = texture2D(textureRate, vTexCoord).a;
        gl_FragColor = mix(a, b, rate);
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

const mixModel = new Model(context, {
  shape: tileShape,
  shader: MixShader,
  blendMode: "src",
})

export
class TileBlender {
  tiles = [0, 1].map(i => new Tile())
  drawTargets = this.tiles.map(tile => new TextureDrawTarget(context, tile.texture))
  clipBaseTile = new Tile()
  clipBaseDrawTarget = new TextureDrawTarget(context, this.clipBaseTile.texture)
  clipTile = new Tile()
  clipDrawTarget = new TextureDrawTarget(context, this.clipTile.texture)
  clipping = false
  hasClipTile = false

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

  startClip(tile: Tile|undefined) {
    this.clipping = true
    if (tile) {
      this.hasClipTile = true
      drawTexture(this.clipBaseDrawTarget, this.currentTile.texture, {blendMode: "src"})
      drawTexture(this.clipDrawTarget, tile.texture, {blendMode: "src"})
    } else {
      this.hasClipTile = false
    }
  }

  blend(tile: Tile, mode: LayerBlendMode, opacity: number) {
    if (this.clipping && !this.hasClipTile) {
      return
    }
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

  applyClip() {
    if (!this.clipping) {
      return
    }
    this.clipping = false
    if (this.hasClipTile) {
      this.swapCurrent()
      mixModel.uniforms = {
        textureA: this.clipBaseTile.texture,
        textureB: this.previousTile.texture,
        textureRate: this.clipTile.texture,
      }
      this.currentDrawTarget.draw(mixModel)
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

export
type LayerBlendHook = (layer: Layer, tileKey: Vec2, tile: Tile|undefined, tileBlender: TileBlender) => boolean

export default
class LayerBlender {
  blendedTexture = new Texture(context, {
    size: this.picture.size,
    pixelType: "half-float",
  })
  drawTarget = new TextureDrawTarget(context, this.blendedTexture)

  hook: LayerBlendHook|undefined

  @observable lastBlend: {rect?: Rect} = {}

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
      drawTexture(this.drawTarget, tileBlenders[0].currentTile.texture, {transform: Transform.translate(offset), blendMode: "src-over"})
    }
    this.lastBlend = {rect}
  }

  renderLayer(layer: Layer, nextLayer: Layer|undefined, key: Vec2, scissor: Rect|undefined, depth: number): boolean {
    const {content} = layer
    let tile: Tile|undefined = undefined

    if (layer.visible) {
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
    }

    const tileBlender = tileBlenders[depth]

    if (!layer.clippingGroup && nextLayer && nextLayer.clippingGroup) {
      tileBlender.startClip(tile)
    }

    let rendered = false
    const hooked = this.hook && this.hook(layer, key, tile, tileBlender)

    if (hooked) {
      rendered = true
    } else if (tile) {
      tileBlender.blend(tile, layer.blendMode, layer.opacity)
      rendered = true
    }

    if (layer.clippingGroup && !(nextLayer && nextLayer.clippingGroup)) {
      tileBlender.applyClip()
    }
    return rendered
  }

  renderLayers(layers: Layer[], key: Vec2, scissor: Rect|undefined, depth: number): boolean {
    if (!tileBlenders[depth]) {
      tileBlenders[depth] = new TileBlender()
    }
    tileBlenders[depth].setScissor(scissor)
    tileBlenders[depth].clear()
    let rendered = false
    for (let i = layers.length - 1; i >= 0; --i) {
      const childRendered = this.renderLayer(layers[i], layers[i-1], key, scissor, depth)
      rendered = rendered || childRendered
    }
    return rendered
  }

  dispose() {
    this.drawTarget.dispose()
    this.blendedTexture.dispose()
  }
}
