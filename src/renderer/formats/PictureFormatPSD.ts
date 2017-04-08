import PSDReader from '../../lib/PSDReader'
import {PSDColorMode, PSDSectionType, PSDBlendModeKey} from '../../lib/PSDTypes'
import {addPictureFormat} from '../app/FormatRegistry'
import Layer, {ImageLayer, GroupLayer, LayerBlendMode} from '../models/Layer'
import Picture from '../models/Picture'
import PictureFormat from './PictureFormat'

function parseBlendMode(mode: PSDBlendModeKey): LayerBlendMode {
  switch (mode) {
    default:
    case 'norm':
      return 'normal'
    case 'mul ':
      return 'multiply'
    case 'lddg':
      return 'plus'
    // TODO: add more
  }
}

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
    let groupStack = [picture.rootLayer]
    for (const layerRecord of [...reader.layerRecords].reverse()) {
      const topGroup = groupStack[groupStack.length - 1]
      const {sectionType, name, opacity, clipping, transparencyProtected, visible, blendMode} = layerRecord
      const layerProps = {
        name, opacity,
        preserveOpacity: transparencyProtected,
        clippingGroup: clipping,
        visible,
        blendMode: parseBlendMode(blendMode),
      }
      if (sectionType === PSDSectionType.Layer) {
        const layer = new ImageLayer(picture, layerProps)
        topGroup.children.push(layer)
      } else if (sectionType === PSDSectionType.OpenFolder || sectionType === PSDSectionType.ClosedFolder) {
        const group = new GroupLayer(picture, layerProps, [])
        group.collapsed = sectionType === PSDSectionType.ClosedFolder
        topGroup.children.push(group)
        groupStack.push(group)
      } else if (sectionType === PSDSectionType.BoundingSectionDivider) {
        groupStack.pop()
      }
    }

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
