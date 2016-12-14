import {observable, computed, reaction} from "mobx"
import {Vec2, Rect, Transform} from "paintvec"
import {Texture, Model, RectShape, Shader, TextureShader, CanvasDrawTarget, Color, TextureFilter} from "paintgl"
import {context, canvas} from "../GLContext"
import {frameDebounce} from "../../lib/Debounce"
import Picture from "../models/Picture"

const BOX_SHADOW_RADIUS = 4
const BOX_SHADOW_OPACITY = 0.5

class BoxShadowShader extends Shader {
  get additionalVertexShader() {
    return `
      varying mediump vec2 vPicturePos;
      uniform mat3 transformToPicture;

      void paintgl_additional() {
        vPicturePos = (transformToPicture * vec3(aPosition, 1.0)).xy;
      }
    `
  }

  // http://madebyevan.com/shaders/fast-rounded-rectangle-shadows/
  get fragmentShader() {
    return `
      precision mediump float;
      varying vec2 vPicturePos;
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
        float a = boxShadow(vec2(0.0), pictureSize, vPicturePos, ${BOX_SHADOW_RADIUS.toFixed(1)});
        gl_FragColor = vec4(0.0, 0.0, 0.0, a * ${BOX_SHADOW_OPACITY});
      }
    `
  }
}

const SELECTION_DURATION = 100

class SelectionShader extends Shader {
  get additionalVertexShader() {
    return `
      varying vec2 vTexXOffset;
      varying vec2 vTexYOffset;
      uniform vec2 pictureSize;
      uniform mat3 transformToPicture;

      mat2 getScaleRotation(mat3 m) {
        return mat2(m[0][0], m[0][1], m[1][0], m[1][1]);
      }

      void paintgl_additional() {
        mat2 scaleRotation = getScaleRotation(transformToPicture);
        vTexXOffset = scaleRotation * vec2(1.0, 0.0) / pictureSize;
        vTexYOffset = scaleRotation * vec2(0.0, 1.0) / pictureSize;
      }
    `
  }
  get fragmentShader() {
    return `
      precision highp float;

      uniform sampler2D texture;
      uniform float milliseconds;
      varying vec2 vTexCoord;
      varying vec2 vTexXOffset;
      varying vec2 vTexYOffset;

      #define STRIPE_WIDTH 4.0
      #define STEP 2.0

      bool isSelected(vec2 texCoord) {
        float x = texCoord.x;
        float y = texCoord.y;
        if (0.0 <= x && x <= 1.0 && 0.0 <= y && y <= 1.0) {
          return texture2D(texture, texCoord).a != 0.0;
        } else {
          return false;
        }
      }

      void main(void) {
        bool isOutline = false;
        if (isSelected(vTexCoord)) {
          for (int y = -1; y <= 1; ++y) {
            for (int x = -1; x <= 1; ++x) {
              if (x != 0 && y != 0) {
                vec2 texCoord = vTexCoord + vTexXOffset * float(x) + vTexYOffset * float(y);
                if (!isSelected(texCoord)) {
                  isOutline = true;
                }
              }
            }
          }
        }

        if (isOutline) {
          vec2 coord = gl_FragCoord.xy - vec2(0.5);
          float d = coord.x + coord.y + floor(milliseconds / ${SELECTION_DURATION}.0) * STEP;
          float stripe = mod(d / STRIPE_WIDTH, 2.0);
          if (stripe < 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          } else {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
          }
        } else {
          gl_FragColor = vec4(0.0);
        }
      }
    `
  }
}

export default
class Renderer {
  @observable picture: Picture|undefined
  private readonly pictureShape = new RectShape(context, {
    usage: "static",
  })
  private readonly pictureModel = new Model(context, {
    shape: this.pictureShape,
    shader: TextureShader,
  })

  @observable size = new Vec2(100, 100)
  readonly background = new Color(46 / 255, 48 / 255, 56 / 255, 1)

  @observable selectionAnimationEnabled = true

  private readonly rendererShape = new RectShape(context, {
    usage: "static",
  })
  private readonly boxShadowModel = new Model(context, {
    shape: this.rendererShape,
    shader: BoxShadowShader,
  })
  private readonly selectionModel = new Model(context, {
    shape: this.pictureShape,
    shader: SelectionShader,
  })

  private readonly cursorShape = new RectShape(context, {
    usage: "static",
    rect: new Rect(new Vec2(0), new Vec2(1)),
  })
  readonly cursorTexture = new Texture(context, {})
  private readonly cursorModel = new Model(context, {
    shape: this.cursorShape,
    shader: TextureShader,
    uniforms: {
      texture: this.cursorTexture
    }
  })

  @observable cursorVisible = false
  @observable cursorSize = new Vec2()
  @observable cursorPosition = new Vec2()

  @computed get cursorRect() {
    const pos = this.cursorPosition
    const size = this.cursorSize
    return new Rect(pos.sub(size.mulScalar(0.5)), pos.add(size.mulScalar(0.5)))
  }

  private lastCursorRect: Rect|undefined

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

  wholeDirty = true
  dirtyRect: Rect|undefined
  startupTime = Date.now()

  constructor() {
    reaction(() => this.picture, picture => {
      if (picture) {
        this.pictureModel.uniforms = {texture: picture.layerBlender.getBlendedTexture()}
      } else {
        this.pictureModel.uniforms = {}
      }
    })
    reaction(() => this.picture && this.picture.size, size => {
      if (size) {
        this.pictureShape.rect = new Rect(new Vec2(), size)
      }
    })
    reaction(() => this.size, size => {
      canvas.width = size.width
      canvas.height = size.height
      this.rendererShape.rect = new Rect(new Vec2(), size)
    })
    reaction(() => [this.size, this.transformToPicture], () => {
      this.wholeDirty = true
      this.update()
    })
    reaction(() => this.picture && this.picture.lastUpdate, update => {
      if (!update) {
        return
      }
      if (update.rect) {
        this.addPictureDirtyRect(update.rect)
      } else {
        this.wholeDirty = true
      }
      this.update()
    })
    setInterval(() => {
      if (this.picture && this.picture.selection.hasSelection && this.selectionAnimationEnabled) {
        this.wholeDirty = true
        this.update()
      }
    }, SELECTION_DURATION)
    reaction(() => [this.cursorRect, this.cursorVisible], () => {
      if (this.cursorVisible) {
        if (this.lastCursorRect) {
          this.addDirtyRect(this.lastCursorRect)
        }
        this.addDirtyRect(this.cursorRect)
      }
      this.update()
    })
  }

  addDirtyRect(rect: Rect) {
    if (this.dirtyRect) {
      this.dirtyRect = this.dirtyRect.union(rect)
    } else {
      this.dirtyRect = rect
    }
  }

  addPictureDirtyRect(rect: Rect) {
    this.addDirtyRect(rect.transform(this.transformFromPicture))
  }

  update = frameDebounce(() => this.renderNow())

  renderNow() {
    const milliseconds = Date.now() - this.startupTime
    if (!this.wholeDirty && !this.dirtyRect) {
      return
    }

    const drawTarget = new CanvasDrawTarget(context)
    if (!this.wholeDirty && this.dirtyRect) {
      drawTarget.scissor = this.dirtyRect
    }
    drawTarget.clear(this.background)
    if (this.picture) {
      this.boxShadowModel.uniforms = {
        pictureSize: this.picture.size,
        transformToPicture: this.transformToPicture,
      }
      drawTarget.draw(this.boxShadowModel)

      const filter: TextureFilter = this.picture.navigation.scale < 2 ? "bilinear" : "nearest"
      const texture = this.picture.layerBlender.getBlendedTexture()
      if (texture.filter != filter) {
        texture.filter = filter
      }
      this.pictureModel.transform = this.transformFromPicture
      drawTarget.draw(this.pictureModel)

      const {selection} = this.picture
      if (selection.hasSelection) {
        if (selection.texture.filter != filter) {
          selection.texture.filter = filter
        }
        this.selectionModel.uniforms = {
          pictureSize: this.picture.size,
          transformToPicture: this.transformToPicture,
          texture: selection.texture,
          milliseconds
        }
        this.selectionModel.transform = this.transformFromPicture
        drawTarget.draw(this.selectionModel)
      }
    }
    if (this.cursorVisible) {
      this.lastCursorRect = this.cursorRect
      this.cursorModel.transform = Transform.rectToRect(this.cursorShape.rect, this.cursorRect)
      drawTarget.draw(this.cursorModel)
    } else {
      this.lastCursorRect = undefined
    }
    this.dirtyRect = undefined
    this.wholeDirty = false
  }
}

export const renderer = new Renderer()
