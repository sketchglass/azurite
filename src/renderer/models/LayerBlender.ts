import Picture from "./Picture"
import {Vec2, Rect, Transform} from "paintvec"
import {Model, Texture, TextureDrawTarget, Shader, TextureShader, RectShape, PixelType, Color} from "paintgl"
import {context} from "../GLContext"
import TiledTexture from "./TiledTexture"
import Layer from "./Layer"
import {drawTexture} from "../GLUtil"

abstract class BlendShader extends Shader {
  abstract get blendFunc(): string

  get fragmentShader() {
    return `
      precision mediump float;
      varying highp vec2 vTexCoord;
      uniform sampler2D srcTexture;
      uniform sampler2D dstTexture;
      uniform float opacity;
      ${this.blendFunc}
      void main(void) {
        vec4 src = texture2D(srcTexture, vTexCoord) * opacity;
        vec4 dst = texture2D(dstTexture, vTexCoord);
        gl_FragColor = blendFunc(src, dst);
      }
    `
  }
}

class NormalBlendShader extends BlendShader {
  get blendFunc() {
    return `
      vec4 blendFunc(vec4 src, vec4 dst) {
        return src + dst * (1.0 - src.a);
      }
    `
  }
}

class TileBlender {
  shape = new RectShape(context, {
    rect: new Rect(new Vec2(), new Vec2(TiledTexture.tileSize)),
  })
  model = new Model(context, {
    shape: this.shape,
    shader: NormalBlendShader,
  })
  tiles = [0, 1].map(i => new Texture(context, {
    size: new Vec2(TiledTexture.tileSize),
    pixelType: "half-float",
  }))
  drawTargets = this.tiles.map(tile => new TextureDrawTarget(context, tile))

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

  blend(tile: Texture, opacity: number) {
    this.swapCurrent()
    this.model.uniforms = {
      srcTexture: tile,
      dstTexture: this.previousTile,
      opacity
    }
    this.currentDrawTarget.draw(this.model)
  }

  clear() {
    this.currentDrawTarget.clear(new Color(1, 1, 1, 1))
  }
}

const tileBlender = new TileBlender()

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
    const tileKeys = TiledTexture.keysForRect(rect || new Rect(new Vec2(0), this.picture.size))
    for (const key of tileKeys) {
      tileBlender.clear()
      this.renderTile(this.picture.rootLayer, key)
      const offset = key.mulScalar(TiledTexture.tileSize)
      drawTexture(this.drawTarget, tileBlender.currentTile, {offset, blendMode: "src"})
    }
  }

  renderTile(layer: Layer, key: Vec2) {
    if (!layer.visible) {
      return
    }
    const {content} = layer
    if (content.type == "image") {
      if (content.tiledTexture.has(key)) {
        tileBlender.blend(content.tiledTexture.get(key), 1)
      }
    } else {
      const {children} = content
      for (let i = children.length - 1; i >= 0; --i) {
        this.renderTile(children[i], key)
      }
    }
  }

  dispose() {
    this.drawTarget.dispose()
    this.blendedTexture.dispose()
  }
}
