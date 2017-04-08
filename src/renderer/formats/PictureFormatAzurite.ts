import PictureFormat from "./PictureFormat"
import Picture from "../models/Picture"
import Layer from "../models/Layer"
import * as msgpack from "msgpack-lite"

export default
class PictureFormatAzurite extends PictureFormat {
  title = "Azurite Picture"
  mimeType = "application/x-azurite-picture"
  extensions = ["azurite"]

  async importPicture(buffer: Buffer, name: string) {
    const data = msgpack.decode(buffer)
    return Picture.fromData(data)
  }

  async importLayer(buffer: Buffer, name: string, picture: Picture): Promise<Layer> {
    throw new Error("not implemented yet")
  }

  async export(picture: Picture) {
    return msgpack.encode(picture.toData())
  }
}
