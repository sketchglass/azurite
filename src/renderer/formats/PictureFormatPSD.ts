import PSDReader from '../../lib/PSDReader'
import {addPictureFormat} from '../app/FormatRegistry'
import Layer from '../models/Layer'
import Picture from '../models/Picture'
import PictureFormat from './PictureFormat'

@addPictureFormat
export default
class PictureFormatPSD extends PictureFormat {
  title = 'Photoshop'
  mimeType = 'image/x-photoshop'
  extensions = ['psd']

  async importPicture(buffer: Buffer, name: string) {
    const reader = new PSDReader(buffer)
    reader.read()
    // TODO
    return new Picture({width: 0, height: 0, dpi: 72})
  }

  async importLayer(buffer: Buffer, name: string, picture: Picture): Promise<Layer> {
    // TODO
    throw new Error('not implemented yet')
  }
  async export(picture: Picture) {
    // TODO
    return Buffer.alloc(0)
  }
}
