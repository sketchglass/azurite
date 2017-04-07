import PictureFormat from "./PictureFormat"
import Picture from "../models/Picture"
import PSDReader from "../../lib/PSDReader"

export default
class PictureFormatPSD extends PictureFormat {
  title = "Photoshop"
  mimeType = "image/x-photoshop"
  extensions = ["psd"]

  async import(buffer: Buffer) {
    const reader = new PSDReader(buffer)
    reader.read()
    // TODO
    return new Picture({width: 0, height: 0, dpi: 72})
  }

  async export(picture: Picture) {
    // TODO
    return Buffer.alloc(0)
  }
}
