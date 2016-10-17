import {observe} from "mobx"
import {Vec2, Rect, Transform} from "paintvec"
import {Model, RectShape, TextureShader, CanvasDrawTarget, Color} from "paintgl"
import {context, canvas} from "../GLContext"
import Picture from "../models/Picture"
import Navigation from "../models/Navigation"

export default
class Renderer {
  shape: RectShape
  model: Model
  size = new Vec2(100, 100)

  transforms = {
    pictureToRenderer: new Transform(),
    rendererToPicture: new Transform(),
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
    observe(this.picture.navigation, () => {
      this.render()
    })
  }

  updateTransforms() {
    const {navigation} = this.picture
    const pictureCenter = this.picture.size.mulScalar(0.5).round()
    const viewportCenter = this.size.mulScalar(0.5).round()
    let transform = Transform.translate(navigation.translation)
      .merge(Transform.scale(new Vec2(navigation.scale)))
      .merge(Transform.rotate(navigation.rotation))
    if (navigation.horizontalFlip) {
      transform = transform.merge(Transform.scale(new Vec2(-1, 1)))
    }
    this.transforms.pictureToRenderer = Transform.translate(pictureCenter.neg())
      .merge(transform)
      .merge(Transform.translate(viewportCenter))
    this.transforms.rendererToPicture = this.transforms.pictureToRenderer.invert()!
  }

  resize(size: Vec2) {
    this.size = size
    canvas.width = size.width
    canvas.height = size.height
    this.updateTransforms()
    this.render()
  }

  render(rectInPicture?: Rect) {
    this.updateTransforms()
    const drawTarget = new CanvasDrawTarget(context)
    if (rectInPicture) {
      drawTarget.scissor = rectInPicture.transform(this.transforms.pictureToRenderer)
    }
    drawTarget.clear(new Color(240/255, 240/255, 240/255, 1))
    drawTarget.transform = this.transforms.pictureToRenderer
    drawTarget.draw(this.model)
  }
}
