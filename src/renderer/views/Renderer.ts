import {observable, computed, reaction} from "mobx"
import {Vec2, Rect, Transform} from "paintvec"
import {Texture, ShapeModel, RectShape, textureShader, CanvasDrawTarget, Color, TextureFilter} from "paintgl"
import {context, canvas} from "../GLContext"
import {frameDebounce} from "../../lib/Debounce"
import Picture from "../models/Picture"
import Selection from "../models/Selection"
const glsl = require("glslify")

const boxShadowShader = {
  vertex: `
    varying mediump vec2 vPicturePos;
    uniform mat3 transformToPicture;

    void vertexMain(vec2 pos, vec2 uv) {
      vPicturePos = (transformToPicture * vec3(pos, 1.0)).xy;
    }
  `,
  fragment: glsl`
    #pragma glslify: boxShadow = require('../../lib/glsl/boxShadow.glsl')
    #define BOX_SHADOW_RADIUS 4.0
    #define BOX_SHADOW_OPACITY 0.5
    varying vec2 vPicturePos;
    uniform vec2 pictureSize;

    void fragmentMain(vec2 pos, vec2 uv, out vec4 color) {
      float a = boxShadow(vec2(0.0), pictureSize, vPicturePos, BOX_SHADOW_RADIUS);
      color = vec4(0.0, 0.0, 0.0, a * BOX_SHADOW_OPACITY);
    }
  `
}

const SELECTION_DURATION = 100

const selectionShader = {
  vertex: `
    varying mat2 vToTexOffset;
    uniform vec2 pictureSize;
    uniform mat3 transformToPicture;

    mat2 getScaleRotation(mat3 m) {
      return mat2(m[0][0], m[0][1], m[1][0], m[1][1]);
    }

    void vertexMain(vec2 pos, vec2 uv) {
      vec2 texelSize = 1.0 / pictureSize;
      vToTexOffset = mat2(texelSize.x, 0.0, 0.0, texelSize.y) * getScaleRotation(transformToPicture);
    }
  `,
  fragment: `
    uniform sampler2D texture;
    uniform float milliseconds;
    varying mat2 vToTexOffset;

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

    void fragmentMain(vec2 position, vec2 texCoord, out vec4 color) {
      bool isOutline = false;
      if (isSelected(texCoord)) {
        for (int y = -1; y <= 1; ++y) {
          for (int x = -1; x <= 1; ++x) {
            if (x != 0 && y != 0) {
              vec2 uv = texCoord + vToTexOffset * vec2(float(x), float(y));
              if (!isSelected(uv)) {
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
          color = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
          color = vec4(1.0, 1.0, 1.0, 1.0);
        }
      } else {
        color = vec4(0.0);
      }
    }
  `
}

export
interface RendererOverlay {
  renderWithCanvas?: (context: CanvasRenderingContext2D) => void
  // TODO
  // renderWithGL?: (drawTarget: DrawTarget) => void
}

export
type SelectionShowMode = "normal"|"stopped"|"none"

export default
class Renderer {
  @observable overlay: RendererOverlay|undefined
  previewSelection: () => Selection|false = () => false

  @observable picture: Picture|undefined
  private readonly pictureShape = new RectShape(context, {
    usage: "static",
  })
  private readonly pictureModel = new ShapeModel(context, {
    shape: this.pictureShape,
    shader: textureShader,
  })

  @observable size = new Vec2(100, 100)
  readonly background = new Color(46 / 255, 48 / 255, 56 / 255, 1)

  @observable selectionShowMode: SelectionShowMode = "normal"

  private readonly rendererShape = new RectShape(context, {
    usage: "static",
  })
  private readonly boxShadowModel = new ShapeModel(context, {
    shape: this.rendererShape,
    shader: boxShadowShader,
  })
  private readonly selectionModel = new ShapeModel(context, {
    shape: this.pictureShape,
    shader: selectionShader,
  })

  private readonly cursorShape = new RectShape(context, {
    usage: "static",
    rect: new Rect(new Vec2(0), new Vec2(1)),
  })
  readonly cursorTexture = new Texture(context, {})
  private readonly cursorModel = new ShapeModel(context, {
    shape: this.cursorShape,
    shader: textureShader,
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

  private readonly overlayCanvas = document.createElement("canvas")
  private readonly overlayCanvasContext = this.overlayCanvas.getContext("2d")!
  private readonly overlayTexture = new Texture(context, {})
  private readonly overlayModel = new ShapeModel(context, {
    shape: this.rendererShape,
    shader: textureShader,
    uniforms: {
      texture: this.overlayTexture
    }
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
      this.overlayTexture.size = size
      this.overlayCanvas.width = size.width
      this.overlayCanvas.height = size.height
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
      if (this.picture && this.picture.selection.hasSelection && this.selectionShowMode == "normal") {
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
      // render background

      this.boxShadowModel.uniforms = {
        pictureSize: this.picture.size,
        transformToPicture: this.transformToPicture,
      }
      drawTarget.draw(this.boxShadowModel)

      // render picture

      const filter: TextureFilter = this.picture.navigation.scale < 2 ? "bilinear" : "nearest"
      const texture = this.picture.layerBlender.getBlendedTexture()
      if (texture.filter != filter) {
        texture.filter = filter
      }
      this.pictureModel.transform = this.transformFromPicture
      drawTarget.draw(this.pictureModel)

      // render selection
      let previewSelection = this.previewSelection()
      const selection = previewSelection != false ? previewSelection : this.picture.selection

      if (selection.hasSelection && this.selectionShowMode != "none") {
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

    // render cursor

    if (this.cursorVisible) {
      this.lastCursorRect = this.cursorRect
      this.cursorModel.transform = Transform.rectToRect(this.cursorShape.rect, this.cursorRect)
      drawTarget.draw(this.cursorModel)
    } else {
      this.lastCursorRect = undefined
    }

    // render overlay

    if (this.overlay) {
      if (this.overlay.renderWithCanvas) {
        this.overlayCanvasContext.clearRect(0, 0, this.size.width, this.size.height)
        this.overlay.renderWithCanvas(this.overlayCanvasContext)
        this.overlayTexture.setImage(this.overlayCanvas)
      }
      drawTarget.draw(this.overlayModel)
    }

    this.dirtyRect = undefined
    this.wholeDirty = false
  }
}

export const renderer = new Renderer()
