import * as msgpack from 'msgpack-lite'
import Layer from '../models/Layer'
import Picture from '../models/Picture'
import PictureFormat from './PictureFormat'

export default
class PictureFormatAzurite extends PictureFormat {
  title = 'Azurite Picture'
  mimeType = 'application/x-azurite-picture'
  extensions = ['azurite']

  async importPicture(buffer: Buffer, name: string) {
    const data = msgpack.decode(buffer)
    return Picture.fromData(data)
  }

  async importLayer(buffer: Buffer, name: string, picture: Picture): Promise<Layer> {
    throw new Error('not implemented yet')
  }

  async export(picture: Picture) {
    return msgpack.encode(picture.toData())
  }
}
