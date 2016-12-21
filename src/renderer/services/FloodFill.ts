import Picture from "../models/Picture"
import Selection from "../models/Selection"
import {Vec2} from "paintvec"
import {Texture, Shader, RectShape, Model, TextureDrawTarget} from "paintgl"
import {context} from "../GLContext"
import {drawTexture} from "../GLUtil"

class BinaryImage {
  constructor(public width: number, public height: number, public rgba: Uint8Array) {
  }
  get(x: number, y: number) {
    const i = (this.width * y + x) * 4 + 3
    return this.rgba[i]
  }
  set(x: number, y: number, value: number) {
    const i = (this.width * y + x) * 4 + 3
    this.rgba[i] = value ? 255 : 0
  }
}

let floodFillStack: [number, number][] = []

// Stack-based scanline flood fill from http://lodev.org/cgtutor/floodfill.html
export function floodFill(x: number, y: number, src: BinaryImage, dst: BinaryImage) {
  if (dst.get(x, y)) {
    return
  }
  const w = src.width
  const h = src.height
  if (!(0 <= x && x < w && 0 <= y && y < h)) {
    return
  }
  floodFillStack = []

  let x1 = 0
  let spanAbove = false
  let spanBelow = false

  floodFillStack.push([x, y])

  while (floodFillStack.length > 0) {
    const [x, y] = floodFillStack.pop()!
    x1 = x;
    while (x1 >= 0 && src.get(x1, y)) {
      x1--;
    }
    x1++;
    spanAbove = spanBelow = false;
    while (x1 < w && src.get(x1, y)) {
      dst.set(x1, y, 1)
      if (!spanAbove && y > 0 && src.get(x1, y - 1) && !dst.get(x1, y - 1)) {
        floodFillStack.push([x1, y - 1])
        spanAbove = true;
      } else if (spanAbove && y > 0 && !src.get(x1, y - 1)) {
        spanAbove = false;
      }
      if (!spanBelow && y < h - 1 && src.get(x1, y + 1) && !dst.get(x1, y + 1)) {
        floodFillStack.push([x1, y + 1])
        spanBelow = true;
      } else if (spanBelow && y < h - 1 && !src.get(x1, y + 1)) {
        spanBelow = false;
      }
      x1++;
    }
  }
}

class FindFillableRegionShader extends Shader {
  get additionalVertexShader() {
    return `
      uniform vec2 referenceTexCoord;
      uniform sampler2D image;
      varying vec3 vReferenceColor;

      void paintgl_additional() {
        vReferenceColor = texture2D(image, referenceTexCoord).rgb;
      }
    `
  }

  get fragmentShader() {
    return `
      precision highp float;

      uniform float tolerance;
      uniform sampler2D image;

      varying vec2 vTexCoord;
      varying vec3 vReferenceColor;

      void main(void) {
        vec3 color = texture2D(image, vTexCoord).rgb;
        float diff = distance(color, vReferenceColor);
        float opacity = 1.0 - clamp(diff / tolerance, 0.0, 1.0);
        gl_FragColor = vec4(opacity);
      }
    `
  }
}

export default
class FloodFill {
  private readonly fillableRegionTexture = new Texture(context, {size: this.picture.size})
  private readonly filledTexture = new Texture(context, {size: this.picture.size})
  private readonly drawTarget = new TextureDrawTarget(context)
  private readonly shape = new RectShape(context, {rect: this.picture.rect})
  private readonly findFillableRegionModel = new Model(context, {
    shape: this.shape,
    shader: FindFillableRegionShader,
    blendMode: "src",
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
      image: this.picture.layerBlender.getBlendedTexture(),
      tolerance: this.tolerance
    }
    this.drawTarget.draw(this.findFillableRegionModel)
  }

  floodFill(pos: Vec2, selection: Selection) {
    this.updateFillableRegion(pos)

    // Do flood fill (on CPU)
    const {width, height} = this.picture.size
    const {x, y} = pos
    const src = new Uint8Array(width * height * 4)
    this.drawTarget.texture = this.fillableRegionTexture
    this.drawTarget.readPixels(this.picture.rect, src)
    const dst = new Uint8Array(width * height * 4)
    floodFill(x, y,
      new BinaryImage(width, height, src),
      new BinaryImage(width, height, dst)
    )

    this.filledTexture.setData(this.picture.size, dst)
    this.drawTarget.texture = this.filledTexture
    drawTexture(this.drawTarget, this.fillableRegionTexture, {blendMode: "src-in"})
    drawTexture(selection.drawTarget, this.filledTexture, {blendMode: "src-over"})
    selection.checkHasSelection()
  }
}
