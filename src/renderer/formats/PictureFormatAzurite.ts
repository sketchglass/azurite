import PictureFormat from "./PictureFormat"
import Picture from "../models/Picture"
import * as msgpack from "msgpack-lite"

export default
class PictureFormatAzurite extends PictureFormat {
  title = "Azurite Picture"
  mimeType = "application/x-azurite-picture"
  extensions = ["azurite"]

  async import(buffer: Buffer) {
    const data = msgpack.decode(buffer)
    return Picture.fromData(data)
  }

  async export(picture: Picture) {
    return msgpack.encode(picture.toData())
  }
}
