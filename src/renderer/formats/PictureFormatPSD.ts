import {Texture} from 'paintgl'
import {Vec2} from 'paintvec'
import PSDReader from '../../lib/psd/PSDReader'
import {PSDColorMode, PSDSectionType, PSDBlendModeKey, PSDResolutionUnit} from '../../lib/psd/PSDTypes'
import {channelDataToFloatRGBA, imageDataToFloatRGBA} from '../../lib/psd/PSDUtil'
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

@addPictureFormat
export default
class PictureFormatPSD extends PictureFormat {
  title = 'Photoshop'
  mimeType = 'image/x-photoshop'
  extensions = ['psd']

  async importPicture(buffer: Buffer, name: string) {
    const reader = new PSDReader(buffer)
    const result = reader.read()

    if (result.colorMode !== PSDColorMode.RGB) {
      // improve error message
      throw new Error('Only RGB is supported')
    }
    const {depth} = result
    if (depth !== 8 && depth !== 16 && depth !== 32) {
      throw new Error('Binary image is not supported')
    }

    let dpi: number
    if (result.resolutionInfo) {
      const res = result.resolutionInfo.hres
      const resUnit = result.resolutionInfo.hresUnit
      dpi = Math.round(resUnit === PSDResolutionUnit.PixelPerCM ? res * 2.56 : res)
    } else {
      dpi = 72
    }

    const picture = new Picture({width: result.width, height: result.height, dpi})
    let groupStack = [picture.rootLayer]
    for (const layerRecord of [...result.layerRecords].reverse()) {
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
        const data = channelDataToFloatRGBA(result, layerRecord)
        const texture = new Texture(context, {
          size: rect.size,
          pixelType: 'float',
          data,
        })
        layer.tiledTexture.putTexture(rect.topLeft, texture)
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
    const reader = new PSDReader(buffer)
    const result = reader.read()

    if (result.colorMode !== PSDColorMode.RGB) {
      // improve error message
      throw new Error('Only RGB is supported')
    }
    const {depth} = result
    if (depth !== 8 && depth !== 16 && depth !== 32) {
      throw new Error('Binary image is not supported')
    }

    const size = new Vec2(result.width, result.height)
    const data = imageDataToFloatRGBA(result)
    const texture = new Texture(context, {size, data, pixelType: 'float'})

    const layer = new ImageLayer(picture, {name})
    layer.tiledTexture.putTexture(new Vec2(0), texture)
    return layer
  }
  async export(picture: Picture) {
    // TODO
    return Buffer.alloc(0)
  }
}
