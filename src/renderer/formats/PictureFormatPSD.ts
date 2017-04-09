import {Texture} from 'paintgl'
import {Transform} from 'paintvec'
import PSDReader from '../../lib/PSDReader'
import {PSDColorMode, PSDSectionType, PSDBlendModeKey, PSDLayerRecord, PSDResolutionUnit} from '../../lib/PSDTypes'
import {addPictureFormat} from '../app/FormatRegistry'
import {context} from '../GLContext'
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

function parseChannelData(depth: number, layerRecord: PSDLayerRecord) {
  const {channelInfos, channelDatas, rect} = layerRecord
  const size = rect.width * rect.height
  const data = new Float32Array(size * 4)

  for (const [i, channelInfo] of channelInfos.entries()) {
    let offset: number
    if (channelInfo.id >= 0) { // RGB
      offset = channelInfo.id
    } else if (channelInfo.id === -1) { // alpha
      offset = 3
    } else {
      continue
    }
    const channelData = channelDatas[i]
    if (depth === 32) {
      for (let i = 0; i < size; ++i) {
        data[i * 4 + offset] = channelData.readUInt32BE(i * 4) / 0xFFFFFFFF
      }
    } else if (depth === 16) {
      for (let i = 0; i < size; ++i) {
        data[i * 4 + offset] = channelData.readUInt16BE(i * 2) / 0xFFFF
      }
    } else {
      for (let i = 0; i < size; ++i) {
        data[i * 4 + offset] = channelData.readUInt8(i) / 0xFF
      }
    }
  }

  for (let i = 0; i < size; ++i) {
    const a = data[i * 4 + 3]
    data[i * 4] *= a
    data[i * 4 + 1] *= a
    data[i * 4 + 2] *= a
  }

  return data
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

    const res = reader.resolutionInfo.hres
    const resUnit = reader.resolutionInfo.hresUnit
    const dpi = resUnit === PSDResolutionUnit.PixelPerCM ? res * 2.56 : res

    const picture = new Picture({width: reader.width, height: reader.height, dpi})
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
        const {rect} = layerRecord
        const data = parseChannelData(reader.depth, layerRecord)
        const texture = new Texture(context, {
          size: rect.size,
          pixelType: 'float',
          data,
        })
        layer.tiledTexture.drawTexture(texture, {
          transform: Transform.translate(rect.topLeft),
          blendMode: 'src',
        })
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
