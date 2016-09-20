import Picture from "./Picture"
import {Vec2, Vec4} from '../../lib/Geometry'
import {Texture, Framebuffer, Shader, Model, DefaultFramebuffer, DataType} from "../../lib/GL"
import {context} from "../GLContext"
import {unitGeometry} from "../GLUtil"
import TiledTexture from "./TiledTexture"

const layerShader = new Shader(context,
  `
    precision highp float;
    uniform vec2 uTileKey;
    uniform vec2 uPictureSize;
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
    void main(void) {
      vTexCoord = aTexCoord;
      vec2 pos = (uTileKey + (aPosition + 1.0) * 0.5) * ${TiledTexture.tileSize}.0;
      vec2 glPos = pos / uPictureSize * 2.0 - 1.0;
      gl_Position = vec4(glPos, 0.0, 1.0);
    }
  `,
  `
    precision mediump float;
    varying highp vec2 vTexCoord;
    uniform sampler2D uTexture;
    void main(void) {
      gl_FragColor = texture2D(uTexture, vTexCoord);
    }
  `
)
layerShader.uniform("uTexture").setInt(0)

const backgroundShader = new Shader(context,
  `
    precision highp float;
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
    void main(void) {
      vTexCoord = aTexCoord;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `,
  `
    precision mediump float;
    void main(void) {
      gl_FragColor = vec4(1.0);
    }
  `
)

const layerModel = new Model(context, unitGeometry, layerShader)
const backgroundModel = new Model(context, unitGeometry, backgroundShader)

export default
class LayerBlender {
  blendedTexture = new Texture(context, this.picture.size, DataType.HalfFloat)
  framebuffer = new Framebuffer(context, this.blendedTexture)

  constructor(public picture: Picture) {
  }

  render(rect: Vec4|undefined) {
    const {layers} = this.picture
    this.framebuffer.use()
    if (rect) {
      context.setScissor(rect)
    }
    backgroundModel.render()
    const tileKeys = TiledTexture.keysForRect(rect || Vec4.fromVec2(new Vec2(0), this.picture.size))
    const uTileKey = layerShader.uniform("uTileKey")
    layerShader.uniform("uPictureSize").setVec2(this.picture.size)
    for (let i = layers.length - 1; i >= 0; --i) {
      const layer = layers[i]
      for (const key of tileKeys) {
        if (layer.tiledTexture.has(key)) {
          uTileKey.setVec2(key)
          context.textureUnits.set(0, layer.tiledTexture.get(key))
          layerModel.render()
        }
      }
    }
    context.textureUnits.delete(0)
    context.clearScissor()
  }
}
