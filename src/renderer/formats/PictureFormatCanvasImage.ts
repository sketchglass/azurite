import {Vec2} from 'paintvec'

import PictureFormat from './PictureFormat'
import {encodeCanvas, decodeToCanvas} from '../../lib/CanvasEncodeDecode'
import {addPictureFormat} from '../app/FormatRegistry'
import Picture from '../models/Picture'
import TextureToCanvas from '../models/TextureToCanvas'
import {ImageLayer} from '../models/Layer'

function canvasToLayer(canvas: HTMLCanvasElement, name: string, picture: Picture) {
  const layer = new ImageLayer(picture, {name})
  layer.tiledTexture.putImage(new Vec2(), canvas)
  return layer
}

abstract class PictureFormatCanvasImage extends PictureFormat {
  async importPicture(buffer: Buffer, name: string) {
    const canvas = await decodeToCanvas(buffer, this.mimeType)
    const picture = new Picture({
      width: canvas.width,
      height: canvas.height,
      dpi: 72
    })
    const layer = canvasToLayer(canvas, name, picture)
    picture.layers.push(layer)
    picture.selectedLayers.push(layer)
    return picture
  }

  async importLayer(buffer: Buffer, name: string, picture: Picture) {
    const canvas = await decodeToCanvas(buffer, this.mimeType)
    return canvasToLayer(canvas, name, picture)
  }

  async export(picture: Picture) {
    const textureToCanvas = new TextureToCanvas(picture.size)
    textureToCanvas.loadTexture(picture.blender.getBlendedTexture(), new Vec2(0))
    textureToCanvas.updateCanvas()
    return await encodeCanvas(textureToCanvas.canvas, this.mimeType)
  }
}
export default PictureFormatCanvasImage

@addPictureFormat
export
class PictureFormatJPEG extends PictureFormatCanvasImage {
  title = 'JPEG'
  extensions = ['jpg', 'jpeg']
  mimeType = 'image/jpeg'
}

@addPictureFormat
export
class PictureFormatPNG extends PictureFormatCanvasImage {
  title = 'PNG'
  extensions = ['png']
  mimeType = 'image/png'
}

@addPictureFormat
export
class PictureFormatBMP extends PictureFormatCanvasImage {
  title = 'BMP'
  extensions = ['bmp']
  mimeType = 'image/bmp'
}
