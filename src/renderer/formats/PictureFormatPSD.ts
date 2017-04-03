import PictureFormat from "./PictureFormat"
import Picture from "../models/Picture"

export default
class PictureFormatPSD extends PictureFormat {
  title = "Photoshop"
  mimeType = "image/x-photoshop"
  extensions = ["psd"]

  async import(buffer: Buffer) {
    // TODO
    return new Picture({width: 0, height: 0, dpi: 72})
  }

  async export(picture: Picture) {
    // TODO
    return Buffer.alloc(0)
  }
}
