import {observable} from "mobx"
import {Vec2, Rect, Transform} from "paintvec"
import {Model, Shader, RectShape, Texture, TextureDrawTarget} from "paintgl"
import Waypoint from "../models/Waypoint"
import BaseBrushTool from "./BaseBrushTool"
import {context} from "../GLContext"
import TiledTexture from "../models/TiledTexture"
import WatercolorSettings from "../views/WatercolorSettings"
import {AppViewModel} from "../viewmodels/AppViewModel"
import React = require("react")

enum ShapeClipModes {
  Shape, Clip
}

class ShapeClipShader extends Shader {
  get additionalVertexShader() {
    return `
      uniform float uSampleSize;
      uniform float uPressure;
      uniform float uMinWidthRatio;
      uniform float uBrushRadius;
      varying vec2 vOffset;
      varying float vRadius;

      void paintgl_additional() {
        vRadius = uBrushRadius * (uMinWidthRatio + (1.0 - uMinWidthRatio) * uPressure);
        vOffset = aPosition - uSampleSize * 0.5;
      }
    `
  }

  get fragmentShader() {
    return `
      precision mediump float;

      uniform highp vec2 uBrushPos;
      uniform float uSoftness;
      uniform sampler2D uOriginalTexture;
      uniform lowp float uMode;

      varying highp vec2 vOffset;
      varying highp vec2 vTexCoord;
      varying highp float vRadius;

      vec4 fetchOriginal() {
        return texture2D(uOriginalTexture, vTexCoord);
      }

      float calcOpacity(float r) {
        return smoothstep(vRadius, vRadius - max(1.0, vRadius * uSoftness), r);
      }

      void main(void) {
        float r = distance(fract(uBrushPos), vOffset);

        if (uMode == ${ShapeClipModes.Shape}.0) {
          gl_FragColor = vec4(calcOpacity(r));
        } else {
          gl_FragColor = fetchOriginal() * calcOpacity(r);
        }
      }
    `
  }
}

class WatercolorShader extends Shader {
  get additionalVertexShader() {
    return `
      uniform float uSampleSize;
      uniform mediump float uPressure;
      uniform mediump float uOpacity;
      uniform sampler2D uShapeClipTexture;

      varying vec4 vMixColor;
      varying mediump float vOpacity;

      vec4 calcMixColor() {
        float topLod = log2(uSampleSize);
        vec4 sampleAverage = texture2DLod(uShapeClipTexture, vec2(0.75, 0.5), topLod);
        vec4 shapeAverage = texture2DLod(uShapeClipTexture, vec2(0.25, 0.5),  topLod);
        return sampleAverage / shapeAverage.a;
      }

      void paintgl_additional() {
        vMixColor = calcMixColor();
        vOpacity = uOpacity * uPressure;
      }
    `
  }

  get fragmentShader() {
    return `
      precision mediump float;

      uniform float uBlending;
      uniform float uThickness;
      uniform vec4 uColor;

      uniform sampler2D uOriginalTexture;
      uniform sampler2D uShapeClipTexture;

      varying vec4 vMixColor;
      varying vec2 vTexCoord;
      varying float vOpacity;

      void main(void) {
        float opacity = texture2D(uShapeClipTexture, vTexCoord * vec2(0.5, 1.0)).a * vOpacity;
        vec4 orig = texture2D(uOriginalTexture, vTexCoord);

        float mixRate = opacity * uBlending;
        // mix color
        vec4 color = orig * (1.0 - mixRate) + vMixColor * mixRate;
        // add color
        vec4 addColor = uColor * (uThickness * opacity);

        gl_FragColor = addColor + color * (1.0 - addColor.a);
      }
    `
  }
}

export default
class WatercolorTool extends BaseBrushTool {
  minWidthRatio = 1
  @observable blending = 0.5
  @observable thickness = 0.5

  name = "Watercolor"

  shape = new RectShape(context, {rect: new Rect()})
  model = new Model(context, {shape: this.shape, blendMode: "src", shader: WatercolorShader})
  drawTarget = new TextureDrawTarget(context)
  originalTexture = new Texture(context, {pixelType: "half-float"})
  originalDrawTarget = new TextureDrawTarget(context, this.originalTexture)
  shapeClipTexture = new Texture(context, {pixelType: "half-float", filter: "mipmap-nearest"})
  shapeClipDrawTarget = new TextureDrawTarget(context, this.shapeClipTexture)
  shapeClipModel = new Model(context, {shape: this.shape, blendMode: "src", shader: ShapeClipShader})

  sampleSize = 0

  start(waypoint: Waypoint) {
    this.sampleSize = Math.pow(2, Math.ceil(Math.log2(this.width + 2)))

    this.model.uniforms = {
      uSampleSize: this.sampleSize,
      uBlending: this.blending,
      uThickness: this.thickness,
      uColor: AppViewModel.instance.color.toRgb(),
      uOpacity: this.opacity,
    }

    this.shapeClipModel.uniforms = {
      uSampleSize: this.sampleSize,
      uBrushRadius: this.width * 0.5,
      uSoftness: this.softness,
      uMinWidthRatio: this.minWidthRatio,
    }

    this.originalTexture.size = new Vec2(this.sampleSize)
    this.shapeClipTexture.size = new Vec2(this.sampleSize * 2, this.sampleSize)
    this.shape.rect = new Rect(new Vec2(), new Vec2(this.sampleSize))

    return super.start(waypoint)
  }

  renderWaypoints(waypoints: Waypoint[], rect: Rect) {
    const {content} = this.picture.currentLayer
    if (content.type != "image") {
      return
    }
    const {tiledTexture} = content

    for (let i = 0; i < waypoints.length; ++i) {
      const waypoint = waypoints[i]
      this.shapeClipModel.uniforms["uBrushPos"] = waypoint.pos
      this.shapeClipModel.uniforms["uPressure"] = waypoint.pressure
      this.model.uniforms["uPressure"] = waypoint.pressure

      const topLeft = waypoint.pos.floor().sub(new Vec2(this.sampleSize / 2))

      tiledTexture.drawToDrawTarget(this.originalDrawTarget, topLeft.neg(), "src")

      this.shapeClipModel.uniforms["uOriginalTexture"] = this.originalTexture

      // draw brush shape in left of sample texture
      this.shapeClipModel.uniforms["uMode"] = ShapeClipModes.Shape
      this.shapeClipModel.transform = new Transform()
      this.shapeClipDrawTarget.draw(this.shapeClipModel)

      // draw original colors clipped by brush shape in right of sample texture
      this.shapeClipModel.uniforms["uMode"] = ShapeClipModes.Clip
      this.shapeClipModel.transform = Transform.translate(new Vec2(this.sampleSize, 0))
      this.shapeClipDrawTarget.draw(this.shapeClipModel)

      this.shapeClipTexture.generateMipmap()

      this.model.uniforms["uOriginalTexture"] = this.originalTexture
      this.model.uniforms["uShapeClipTexture"] = this.shapeClipTexture

      for (const key of TiledTexture.keysForRect(rect)) {
        this.drawTarget.texture = tiledTexture.get(key)
        this.model.transform = Transform.translate(topLeft.sub(key.mulScalar(TiledTexture.tileSize)))
        this.drawTarget.draw(this.model)
      }
    }
  }

  renderSettings() {
    return React.createFactory(WatercolorSettings)({tool: this})
  }
}
