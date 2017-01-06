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
