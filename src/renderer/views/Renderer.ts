import {observable, computed, reaction} from "mobx"
import {Vec2, Rect, Transform} from "paintvec"
import {Model, RectShape, Shader, TextureShader, CanvasDrawTarget, Color, TextureFilter} from "paintgl"
import {context, canvas} from "../GLContext"
import Picture from "../models/Picture"

const BOX_SHADOW_RADIUS = 4
const BOX_SHADOW_OPACITY = 0.5

class BoxShadowShader extends Shader {
  // http://madebyevan.com/shaders/fast-rounded-rectangle-shadows/
  get fragmentShader() {
    return `
      precision mediump float;
      varying vec2 vPosition;
      uniform mat3 transformToPicture;
      uniform vec2 pictureSize;

      // This approximates the error function, needed for the gaussian integral
      vec4 erf(vec4 x) {
        vec4 s = sign(x), a = abs(x);
        x = 1.0 + (0.278393 + (0.230389 + 0.078108 * (a * a)) * a) * a;
        x *= x;
        return s - s / (x * x);
      }

      // Return the mask for the shadow of a box from lower to upper
      float boxShadow(vec2 lower, vec2 upper, vec2 point, float sigma) {
        vec4 query = vec4(point - lower, point - upper);
        vec4 integral = 0.5 + 0.5 * erf(query * (sqrt(0.5) / sigma));
        return (integral.z - integral.x) * (integral.w - integral.y);
      }

      void main(void) {
        vec2 pos = (transformToPicture * vec3(vPosition, 1.0)).xy;
        float a = boxShadow(vec2(0.0), pictureSize, pos, ${BOX_SHADOW_RADIUS.toFixed(1)});
        gl_FragColor = vec4(0.0, 0.0, 0.0, a * ${BOX_SHADOW_OPACITY});
      }
    `
  }
}

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
  disposers: (() => void)[] = []
  background = new Color(46/255, 48/255, 56/255, 1)

  readonly wholeShape = new RectShape(context, {
    usage: "static",
  })
  readonly boxShadowModel = new Model(context, {
    shape: this.wholeShape,
    shader: BoxShadowShader,
  })

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

  @computed get lastBlend() {
    if (this.picture) {
      return this.picture.layerBlender.lastBlend
    }
  }

  constructor() {
    this.disposers.push(
      reaction(() => this.picture, picture => {
        if (picture) {
          this.shape.rect = new Rect(new Vec2(), picture.size)
          this.model.uniforms = {texture: picture.layerBlender.blendedTexture}
        } else {
          this.model.uniforms = {}
        }
      }),
      reaction(() => this.lastBlend, blend => {
        this.render(blend && blend.rect)
      }),
      reaction(() => this.size, size => {
        canvas.width = size.width
        canvas.height = size.height
        this.wholeShape.rect = new Rect(new Vec2(), size)
      }),
      reaction(() => [this.size, this.transformToPicture], () => {
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
    this.model.dispose()
    this.shape.dispose()
  }

  render(rectInPicture?: Rect) {
    const drawTarget = new CanvasDrawTarget(context)
    if (rectInPicture) {
      drawTarget.scissor = rectInPicture.transform(this.transformFromPicture)
    }
    drawTarget.clear(this.background)
    if (this.picture) {
      this.boxShadowModel.uniforms = {
        pictureSize: this.picture.size,
        transformToPicture: this.transformToPicture,
      }
      drawTarget.draw(this.boxShadowModel)

      const filter: TextureFilter = this.picture.navigation.scale < 2 ? "bilinear" : "nearest"
      const texture = this.picture.layerBlender.blendedTexture
      if (texture.filter != filter) {
        texture.filter = filter
      }
      this.model.transform = this.transformFromPicture
      drawTarget.draw(this.model)
    }
  }
}
