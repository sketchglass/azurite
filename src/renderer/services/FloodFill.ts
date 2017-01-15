import Picture from "../models/Picture"
import Selection from "../models/Selection"
import {Vec2, Rect} from "paintvec"
import {Texture, RectShape, ShapeModel, TextureDrawTarget} from "paintgl"
import {context} from "../GLContext"
import {drawTexture, drawVisibilityToBinary, drawBinaryToVisibility} from "../GLUtil"
import nativelib = require("../../common/nativelib")

class BinaryImage {
  data: Int32Array
  readonly stride = Math.ceil(this.width / 32)

  constructor(public readonly width: number, public readonly height: number, data?: Int32Array) {
    this.data = data || new Int32Array(this.stride * height)
  }

  get(x: number, y: number) {
    const xcell = x >> 5
    const xbit = x - (xcell << 5)
    const cell = this.data[y * this.stride + xcell]
    return (cell >> xbit) & 1
  }

  set(x: number, y: number, value: number) {
    const xcell = x >> 5
    const xbit = x - (xcell << 5)
    if (value) {
      this.data[y * this.stride + xcell] |= (1 << xbit)
    } else {
      this.data[y * this.stride + xcell] &= ~(1 << xbit)
    }
  }
}

export function floodFill(x: number, y: number, src: BinaryImage, dst: BinaryImage) {
  nativelib.floodFill(x, y, src.width, src.height, src.data, dst.data)
}

const findFillableRegionShader = {
  vertex: `
    uniform vec2 referenceTexCoord;
    uniform sampler2D image;
    varying vec3 vReferenceColor;

    void vertexMain(vec2 pos, vec2 uv) {
      vReferenceColor = texture2D(image, referenceTexCoord).rgb;
    }
  `,
  fragment: `
    uniform float tolerance;
    uniform sampler2D image;
    varying vec3 vReferenceColor;

    void fragmentMain(vec2 pos, vec2 uv, out vec4 outColor) {
      vec3 color = texture2D(image, uv).rgb;
      float diff = distance(color, vReferenceColor);
      float opacity = 1.0 - clamp(diff / tolerance, 0.0, 1.0);
      outColor = vec4(opacity);
    }
  `
}

export default
class FloodFill {
  private readonly fillableRegionTexture = new Texture(context, {size: this.picture.size})
  private readonly filledTexture = new Texture(context, {size: this.picture.size})
  private readonly drawTarget = new TextureDrawTarget(context)
  private readonly shape = new RectShape(context, {rect: this.picture.rect})
  private readonly findFillableRegionModel = new ShapeModel(context, {
    shape: this.shape,
    shader: findFillableRegionShader,
    blendMode: "src",
  })
  private readonly binaryTexture = new Texture(context, {
    size: new Vec2(Math.ceil(this.picture.size.width / 32), this.picture.size.height)
  })

  tolerance = 0.5 / 255 // 0 ... 1

  constructor(public readonly picture: Picture) {
  }

  dispose() {
    this.findFillableRegionModel.dispose()
    this.shape.dispose()
    this.drawTarget.dispose()
    this.fillableRegionTexture.dispose()
  }

  private updateFillableRegion(pos: Vec2) {
    const referenceTexCoord = pos.add(new Vec2(0.5)).div(this.picture.size)
    this.drawTarget.texture = this.fillableRegionTexture
    this.findFillableRegionModel.uniforms = {
      referenceTexCoord,
      image: this.picture.blender.getBlendedTexture(),
      tolerance: this.tolerance
    }
    this.drawTarget.draw(this.findFillableRegionModel)
  }

  floodFill(pos: Vec2, selection: Selection) {
    this.updateFillableRegion(pos)

    // Do flood fill (on CPU)
    const {width, height} = this.picture.size
    const stride = Math.ceil(width / 32)
    const {x, y} = pos
    const src = new Int32Array(stride * height)
    this.drawTarget.texture = this.binaryTexture
    drawVisibilityToBinary(this.drawTarget, this.fillableRegionTexture)
    this.drawTarget.readPixels(new Rect(new Vec2(), new Vec2(stride, height)), new Uint8Array(src.buffer))
    const dst = new Int32Array(stride * height)
    floodFill(x, y,
      new BinaryImage(width, height, src),
      new BinaryImage(width, height, dst)
    )
    this.binaryTexture.setData(this.binaryTexture.size, new Uint8Array(dst.buffer))

    this.drawTarget.texture = this.filledTexture
    drawBinaryToVisibility(this.drawTarget, this.binaryTexture)
    drawTexture(this.drawTarget, this.fillableRegionTexture, {blendMode: "src-in"})
    drawTexture(selection.drawTarget, this.filledTexture, {blendMode: "src-over"})
    selection.checkHasSelection()
  }
}
