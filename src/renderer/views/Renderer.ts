import {observable, computed, reaction} from "mobx"
import {Vec2, Rect, Transform} from "paintvec"
import {Model, RectShape, TextureShader, CanvasDrawTarget, Color} from "paintgl"
import {context, canvas} from "../GLContext"
import Picture from "../models/Picture"
import Navigation from "../models/Navigation"

export default
class Renderer {
  readonly shape: RectShape
  readonly model: Model
  @observable size = new Vec2(100, 100)

  @computed get transformFromPicture() {
    const {navigation} = this.picture
    const pictureCenter = this.picture.size.mulScalar(0.5).round()
    const viewportCenter = this.size.mulScalar(0.5).round()
    let transform = Transform.translate(navigation.translation)
      .merge(Transform.scale(new Vec2(navigation.scale)))
      .merge(Transform.rotate(navigation.rotation))
    if (navigation.horizontalFlip) {
      transform = transform.merge(Transform.scale(new Vec2(-1, 1)))
    }
    return Transform.translate(pictureCenter.neg())
      .merge(transform)
      .merge(Transform.translate(viewportCenter))
  }

  @computed get transformToPicture() {
    return this.transformFromPicture.invert()!
  }

  constructor(public picture: Picture) {
    const {width, height} = picture.size
    this.shape = new RectShape(context, {
      usage: "static",
      rect: new Rect(new Vec2(), picture.size),
    })
    this.model = new Model(context, {
      shape: this.shape,
      shader: TextureShader,
      uniforms: {
        texture: picture.layerBlender.blendedTexture,
      },
    })
    this.picture.updated.forEach(rect => {
      this.render(rect)
    })
    reaction(() => this.size, size => {
      canvas.width = size.width
      canvas.height = size.height
    })
    reaction(() => this.transformToPicture, () => {
      requestAnimationFrame(() => {
        this.render()
      })
    })
  }

  render(rectInPicture?: Rect) {
    const drawTarget = new CanvasDrawTarget(context)
    if (rectInPicture) {
      drawTarget.scissor = rectInPicture.transform(this.transformFromPicture)
    }
    drawTarget.clear(new Color(240/255, 240/255, 240/255, 1))
    drawTarget.transform = this.transformFromPicture
    drawTarget.draw(this.model)
  }
}
