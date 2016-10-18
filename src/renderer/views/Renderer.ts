import {observable, computed, reaction} from "mobx"
import {Subscription} from "rxjs/Subscription"
import {Vec2, Rect, Transform} from "paintvec"
import {Model, RectShape, TextureShader, CanvasDrawTarget, Color} from "paintgl"
import {context, canvas} from "../GLContext"
import Picture from "../models/Picture"
import Navigation from "../models/Navigation"

export default
class Renderer {
  @observable picture: Picture|undefined
  readonly shape = new RectShape(context, {
    usage: "static",
  })
  readonly model = new Model(context, {
    shape: this.shape,
    shader: TextureShader,
  })
  @observable size = new Vec2(100, 100)
  updatedSubscription: Subscription|undefined
  disposers: (() => void)[] = []

  @computed get pictureSize() {
    if (this.picture) {
      return this.picture.size
    } else {
      return new Vec2(0)
    }
  }

  @computed get transformFromPicture() {
    if (!this.picture) {
      return new Transform()
    }
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

  constructor() {
    this.disposers.push(
      reaction(() => this.picture, picture => {
        if (this.updatedSubscription) {
          this.updatedSubscription.unsubscribe()
        }
        if (picture) {
          this.shape.rect = new Rect(new Vec2(), picture.size)
          this.model.uniforms = {texture: picture.layerBlender.blendedTexture}
          this.updatedSubscription = picture.updated.subscribe(rect => {
            this.render(rect)
          })
        } else {
          this.model.uniforms = {}
        }
      }),
      reaction(() => this.size, size => {
        canvas.width = size.width
        canvas.height = size.height
      }),
      reaction(() => this.transformToPicture, () => {
        requestAnimationFrame(() => {
          this.render()
        })
      }),
    )
  }

  dispose() {
    for (const disposer of this.disposers) {
      disposer()
    }
    if (this.updatedSubscription) {
      this.updatedSubscription.unsubscribe()
    }
    this.model.dispose()
    this.shape.dispose()
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
