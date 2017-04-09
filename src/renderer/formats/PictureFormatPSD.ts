import {Texture, TextureDrawTarget} from 'paintgl'
import {Vec2, Rect} from 'paintvec'
import PSDReader from '../../lib/psd/PSDReader'
import {
  PSDColorMode,
  PSDSectionType,
  PSDBlendModeKey,
  PSDResolutionInfo,
  PSDResolutionUnit,
  PSDDimensionUnit,
  PSDLayerRecord,
  PSDData,
} from '../../lib/psd/PSDTypes'
import {
  channelDataToFloatRGBA,
  imageDataToFloatRGBA,
  floatRGBAToChannelData8,
  floatRGBAToImageData8,
} from '../../lib/psd/PSDUtil'
import PSDWriter from '../../lib/psd/PSDWriter'
import {addPictureFormat} from '../app/FormatRegistry'
import {context} from '../GLContext'
import {drawTexture} from '../GLUtil'
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

function emitBlendMode(mode: LayerBlendMode): PSDBlendModeKey {
  switch (mode) {
    default:
    case 'normal':
      return 'norm'
    case 'multiply':
      return 'mul '
    case 'plus':
      return 'lddg'
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
    const writer = new PSDWriter()

    const layerRecords: PSDLayerRecord[] = []

    const addLayerRecord = (layer: Layer) => {
      let rect = Rect.fromWidthHeight(0, 0, 0, 0)
      let sectionType = PSDSectionType.Layer
      let channelDatas: Buffer[] = Array(4).fill(Buffer.alloc(0))

      if (layer instanceof ImageLayer) {
        const boundingRect = layer.tiledTexture.boundingRect()
        if (boundingRect) {
          rect = boundingRect
          const texture = layer.tiledTexture.cropToTexture(rect, {pixelType: 'float'})
          const drawTarget = new TextureDrawTarget(context, texture)
          const data = new Float32Array(rect.width * rect.height * 4)
          drawTarget.readPixels(new Rect(new Vec2(), rect.size), data)
          drawTarget.dispose()
          texture.dispose()
          channelDatas = floatRGBAToChannelData8(data, rect.width, rect.height)
        }
      } else if (layer instanceof GroupLayer) {
        if (layer.collapsed) {
          sectionType = PSDSectionType.ClosedFolder
        } else {
          sectionType = PSDSectionType.OpenFolder
        }
      }
      const channelInfos = [
        {id: 0, dataLength: 0},
        {id: 1, dataLength: 0},
        {id: 2, dataLength: 0},
        {id: -1, dataLength: 0},
      ]

      const record: PSDLayerRecord = {
        name: layer.name,
        opacity: layer.opacity,
        clipping: layer.clippingGroup,
        transparencyProtected: layer.preserveOpacity,
        visible: layer.visible,
        rect,
        blendMode: emitBlendMode(layer.blendMode),
        sectionType,
        channelInfos,
        channelDatas,
      }

      layerRecords.unshift(record)
      if (layer instanceof GroupLayer) {
        layer.children.forEach(addLayerRecord)
        const sectionDivider: PSDLayerRecord = {
          name: 'End of Group',
          opacity: 1,
          clipping: false,
          transparencyProtected: false,
          visible: true,
          rect,
          blendMode: 'norm',
          sectionType: PSDSectionType.BoundingSectionDivider,
          channelInfos,
          channelDatas,
        }
        layerRecords.unshift(sectionDivider)
      }
    }
    picture.layers.forEach(addLayerRecord)

    const resolutionInfo: PSDResolutionInfo = {
      hres: picture.dimension.dpi,
      hresUnit: PSDResolutionUnit.PixelPerInch,
      widthUnit: PSDDimensionUnit.Inch,
      vres: picture.dimension.dpi,
      vresUnit: PSDResolutionUnit.PixelPerInch,
      heightUnit: PSDDimensionUnit.Inch,
    }
    const {width, height} = picture.dimension

    const floatTexture = new Texture(context, {
      size: picture.size,
      pixelType: 'float'
    })
    const drawTarget = new TextureDrawTarget(context, floatTexture)
    drawTexture(drawTarget, picture.blender.getBlendedTexture(), {
      blendMode: 'src'
    })
    const floatImageData = new Float32Array(width * height * 4)
    drawTarget.readPixels(Rect.fromWidthHeight(0, 0, width, height), floatImageData)
    const imageData = floatRGBAToImageData8(floatImageData, width, height)

    const psd: PSDData = {
      channelCount: 4,
      height,
      width,
      depth: 8, // emit in 8bit as many apps only supports 8bit
      colorMode: PSDColorMode.RGB,
      resolutionInfo,
      imageDataHasAlpha: true,
      layerRecords,
      imageData,
    }
    writer.write(psd)

    return writer.data
  }
}
