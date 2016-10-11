import {Vec2, Rect, Transform} from "paintvec"
import {Shader, RectShape, Texture, TextureDrawTarget} from "paintgl"
import Waypoint from "./Waypoint"
import BaseBrushTool from "./BaseBrushTool"
import {context} from "../GLContext"
import TiledTexture from "./TiledTexture"
import WatercolorSettings from "../views/WatercolorSettings"
import React = require("react")

enum SampleModes {
  Shape, Clip
}

class SampleShader extends Shader {
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
        vOffset = aPosition - uSampleSize;
      }
    `
  }

  get fragmentShader() {
    return `
      precision mediump float;

      uniform highp vec2 uBrushPos;
      uniform float uSoftness;
      uniform sampler2D uOriginal;
      uniform lowp int uMode;

      varying highp vec2 vOffset;
      varying highp vec2 vTexCoord;
      varying highp float vRadius;

      vec4 fetchOriginal() {
        return texture2D(uOriginal, vTexCoord);
      }

      float calcOpacity(float r) {
        return smoothstep(vRadius, vRadius - max(1.0, vRadius * uSoftness), r);
      }

      void main(void) {
        float r = distance(fract(uBrushPos), vOffset);

        if (uMode == ${SampleModes.Shape}) {
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
      uniform sampler2D uSampleShape;

      varying vec4 vMixColor;
      varying mediump float vOpacity;

      vec4 calcMixColor() {
        float topLod = log2(uSampleSize);
        vec4 sampleAverage = texture2DLod(uSampleShape, vec2(0.75, 0.5), topLod);
        vec4 shapeAverage = texture2DLod(uSampleShape, vec2(0.25, 0.5),  topLod);
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

      uniform sampler2D uSampleOriginal;
      uniform sampler2D uSampleShape;

      varying vec4 vMixColor;
      varying vec2 vTexCoord;
      varying float vOpacity;

      void main(void) {
        float opacity = texture2D(uSampleShape, vTexCoord * vec2(0.5, 1.0)).a * vOpacity;
        vec4 orig = texture2D(uSampleOriginal, vTexCoord);

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
  blending = 0.5
  thickness = 0.5

  name = "Watercolor"

  shape = new RectShape(context, {rect: new Rect(), blendMode: "src"})
  drawTarget = new TextureDrawTarget(context)
  originalTexture = new Texture(context, {pixelType: "half-float"})
  sampleTexture = new Texture(context, {pixelType: "half-float", filter: "mipmap-nearest"})
  sampleDrawTarget = new TextureDrawTarget(context, this.sampleTexture)

  sampleSize = 0

  start(waypoint: Waypoint) {
    const layerSize = this.picture.currentLayer.size
    this.sampleSize = Math.pow(2, Math.ceil(Math.log2(this.width + 2)))

    this.shape.uniforms = {
      uLayerSize: layerSize,
      uSampleSize: this.sampleSize,
      uBlending: this.blending,
      uThickness: this.thickness,
      uColor: this.color,
      uOpacity: this.opacity,
      uBrushRadius: this.width * 0.5,
      uSoftness: this.softness,
      uMinWidthRatio: this.minWidthRatio,
    }

    this.originalTexture.size = new Vec2(this.sampleSize)
    this.sampleTexture.size = new Vec2(this.sampleSize * 2, this.sampleSize)

    return super.start(waypoint)
  }

  renderWaypoints(waypoints: Waypoint[], rect: Rect) {
    const {tiledTexture} = this.picture.currentLayer

    const {shape} = this

    for (let i = 0; i < waypoints.length; ++i) {
      const waypoint = waypoints[i]
      shape.uniforms["uBrushPos"] = waypoint.pos
      shape.uniforms["uPressure"] = waypoint.pressure
      const topLeft = waypoint.pos.floor().sub(new Vec2(this.sampleSize / 2))

      tiledTexture.readToTexture(this.originalTexture, topLeft)

      shape.shader = SampleShader

      shape.uniforms["uSampleOriginal"] = this.originalTexture

      // draw brush shape in left of sample texture
      shape.uniforms["uMode"] = SampleModes.Shape
      shape.transform = Transform.translate(topLeft.neg())
      this.sampleDrawTarget.draw(shape)

      // draw original colors clipped by brush shape in right of sample texture
      shape.uniforms["uMode"] = SampleModes.Clip
      shape.transform = Transform.translate(topLeft.neg().add(new Vec2(this.sampleSize, 0)))
      this.sampleDrawTarget.draw(shape)

      this.sampleTexture.generateMipmap()

      shape.shader = WatercolorShader

      for (const key of TiledTexture.keysForRect(rect)) {
        this.drawTarget.texture = tiledTexture.get(key)
        shape.uniforms["uSampleOriginal"] = this.originalTexture
        shape.uniforms["uSampleShape"] = this.sampleTexture
        shape.transform = Transform.translate(key.mulScalar(-TiledTexture.tileSize))
        this.drawTarget.draw(shape)
      }
    }
  }

  renderSettings() {
    return React.createFactory(WatercolorSettings)({tool: this})
  }
}
