import {encodeImage, decodeToImage} from "../../lib/ImageFile"

abstract class ImageFormat {
  abstract title: string
  abstract mimeType: string
  abstract extensions: string[]

  async import(buffer: Buffer) {
    return await decodeToImage(buffer, this.mimeType)
  }
  async export(canvas: HTMLCanvasElement) {
    return await encodeImage(canvas, this.mimeType)
  }
}
export default ImageFormat

export
class JPEGImageFormat extends ImageFormat {
  title = "JPEG"
  extensions = ["jpg", "jpeg"]
  mimeType = "image/jpeg"
}

export
class PNGImageFormat extends ImageFormat {
  title = "PNG"
  extensions = ["png"]
  mimeType = "image/png"
}

export
class BMPImageFormat extends ImageFormat {
  title = "BMP"
  extensions = ["bmp"]
  mimeType = "image/bmp"
}
