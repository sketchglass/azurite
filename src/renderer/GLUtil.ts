import {Vec4, Transform} from "../lib/Geometry"
import {Context, Shader} from "../lib/GL"

export
abstract class SimpleShader extends Shader {
  get vertexShader() {
    return `
      precision highp float;

      uniform mat3 uTransform;
      attribute vec2 aPosition;
      attribute vec2 aTexCoord;
      varying vec2 vTexCoord;

      void main(void) {
        vTexCoord = aTexCoord;
        vec3 pos = uTransform * vec3(aPosition, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
      }
    `
  }
  uTransform = this.uniform("uTransform")

  constructor(context: Context) {
    super(context)
    this.uTransform.setTransform(Transform.identity)
  }
}

export
class ColorShader extends SimpleShader {
  get fragmentShader() {
    return `
      precision mediump float;
      uniform vec4 uColor;
      void main(void) {
        gl_FragColor = uColor;
      }
    `
  }

  uColor = this.uniform("uColor")
}

export
class TextureShader extends SimpleShader {
  get fragmentShader() {
    return `
      precision mediump float;
      varying highp vec2 vTexCoord;
      uniform sampler2D uTexture;
      void main(void) {
        gl_FragColor = texture2D(uTexture, vTexCoord);
      }
    `
  }
  constructor(context: Context) {
    super(context)
    this.uniform("uTexture").setInt(0)
  }
}
