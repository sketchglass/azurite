import PSDReader from '../../lib/PSDReader'
import {PSDColorMode} from '../../lib/PSDTypes'
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

    if (reader.colorMode !== PSDColorMode.RGB) {
      // improve error message
      throw new Error('Only RGB is supported')
    }
    if (![8, 16, 32].includes(reader.depth)) {
      throw new Error('Binary image is not supported')
    }

    const picture = new Picture({width: reader.width, height: reader.height, dpi: 72})
    return picture
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
