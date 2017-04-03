import Picture from "../models/Picture"

abstract class PictureFormat {
  abstract title: string
  abstract mimeType: string
  abstract extensions: string[]

  abstract import(buffer: Buffer): Promise<Picture>
  abstract export(picture: Picture): Promise<Buffer>
}

export default PictureFormat
