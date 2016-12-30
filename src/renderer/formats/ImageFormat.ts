import {encodeImageData, decodeToImageData} from "../../lib/ImageFile"

abstract class ImageFormat {
  abstract title: string
  abstract mimeType: string
  abstract extensions: string[]

  async import(buffer: Buffer) {
    return await decodeToImageData(buffer, this.mimeType)
  }
  async export(image: ImageData) {
    return await encodeImageData(image, this.mimeType)
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
