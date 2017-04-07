import Picture from "../models/Picture"
import Layer from "../models/Layer"

abstract class PictureFormat {
  abstract title: string
  abstract mimeType: string
  abstract extensions: string[]

  abstract importPicture(buffer: Buffer, name: string): Promise<Picture>
  abstract importLayer(buffer: Buffer, name: string, picture: Picture): Promise<Layer>
  abstract export(picture: Picture): Promise<Buffer>
}

export default PictureFormat
