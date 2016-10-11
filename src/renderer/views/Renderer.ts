import {Vec2, Rect, Transform} from "paintvec"
import {RectShape, TextureShader, CanvasDrawTarget, Color} from "paintgl"
import {context, canvas} from "../GLContext"
import Picture from "../models/Picture"
import Navigation from "../models/Navigation"

export default
class Renderer {
  shape: RectShape
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
      shader: TextureShader,
    })
    this.picture.changed.forEach(() => this.render())
  }

  updateTransforms() {
    const {navigation} = this.picture
    const pictureCenter = this.picture.size.mulScalar(0.5).round()
    const viewportCenter = this.size.mulScalar(0.5).round()
    const transform = Transform.translate(navigation.translation)
      .merge(Transform.scale(new Vec2(navigation.scale)))
      .merge(Transform.rotate(navigation.rotation))
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
    drawTarget.draw(this.shape)
  }
}
