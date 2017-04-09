import * as iconv from 'iconv-lite'
import {
  PSDData,
  PSDImageResourceID,
  PSDResolutionInfo,
  PSDCompression,
  PSDLayerRecord,
  PSDAdditionalLayerInfoKey,
} from './PSDTypes'

class PSDBinaryWriter {
  offset = 0
  sizeMarkers: {offset: number, bytes: 1|2|4}[] = []
  data = Buffer.alloc(0)
  constructor() {
  }
  grow(size: number) {
    if (this.data.length < size) {
      const data = Buffer.alloc(size * 3)
      data.set(this.data, 0)
      this.data = data
    }
  }
  buffer(buffer: Buffer) {
    this.grow(this.offset + buffer.length)
    this.data.set(buffer, this.offset)
    this.offset += buffer.length
  }
  zeroes(size: number) {
    this.grow(this.offset + size)
    this.offset += size
  }
  uint8(value: number) {
    this.grow(this.offset + 1)
    this.data.writeUInt8(value, this.offset)
    this.offset += 1
  }
  uint16(value: number) {
    this.grow(this.offset + 2)
    this.data.writeUInt16BE(value, this.offset)
    this.offset += 2
  }
  int16(value: number) {
    this.grow(this.offset + 2)
    this.data.writeInt16BE(value, this.offset)
    this.offset += 2
  }
  uint32(value: number) {
    this.grow(this.offset + 1)
    this.data.writeUInt32BE(value, this.offset)
    this.offset += 1
  }
  ascii(str: string, len: number) {
    this.grow(this.offset + len)
    this.data.write(str, this.offset, len, 'ascii')
    this.offset += len
  }
  utf16(str: string, len: number) {
    this.grow(this.offset + len * 2)
    const data = iconv.encode(str, 'utf16-be').slice(0, len * 2)
    this.data.set(data, this.offset)
    this.offset += len * 2
  }
  pascalString(str: string, alignment: number) {
    const count = Math.min(str.length, 255)
    const totalCount = count + 1
    const alignedCount = Math.ceil(totalCount / alignment) * alignment
    this.uint8(count)
    this.ascii(str, count)
    this.zeroes(alignedCount - totalCount)
  }
  unicodePascalString(str: string) {
    const count = str.length
    this.uint32(count)
    this.utf16(str, count)
  }
  sizeBegin(bytes: 1|2|4) {
    this.grow(this.offset + bytes)
    this.sizeMarkers.push({
      offset: this.offset,
      bytes,
    })
    this.offset += bytes
  }
  sizeEnd() {
    const sizeMarker = this.sizeMarkers.pop()
    if (sizeMarker == undefined) {
      throw new Error('cannot pop offset')
    }
    const {offset, bytes} = sizeMarker
    const size = this.offset - offset - bytes
    switch (bytes) {
      case 1:
        this.data.writeUInt8(size, offset)
        break
      case 2:
        this.data.writeUInt16BE(size, offset)
        break
      case 4:
        this.data.writeUInt32BE(size, offset)
        break
    }
  }
}

export default
class PSDWriter {
  writer = new PSDBinaryWriter()

  write(psd: PSDData) {
    this.writeFileHeader(psd)
    this.writeColorModeData()
    this.writeImageResources(psd)
    this.writeLayerAndMaskInformation(psd)
    this.writeImageDataSection(psd)
  }

  writeFileHeader(psd: PSDData) {
    const {writer} = this
    writer.ascii('8BPS', 4)
    writer.uint16(1) // version
    writer.zeroes(6)
    writer.uint16(psd.channelCount)
    writer.uint32(psd.height)
    writer.uint32(psd.width)
    writer.uint16(psd.depth)
    writer.uint16(psd.colorMode)
  }

  writeColorModeData() {
    this.writer.uint32(0)
  }

  writeImageResources(psd: PSDData) {
    const {writer} = this
    writer.sizeBegin(4)

    if (psd.resolutionInfo) {
      writer.ascii('8BIM', 4)
      writer.uint16(PSDImageResourceID.ResolutionInfo)
      writer.pascalString('', 2)
      writer.sizeBegin(4)
      this.writeResolutionInfo(psd.resolutionInfo)
      writer.sizeEnd()
    }

    writer.sizeEnd()
  }

  writeResolutionInfo(info: PSDResolutionInfo) {
    const {writer} = this
    writer.uint32(Math.round(info.hres * 0x10000))
    writer.uint16(info.hresUnit)
    writer.uint16(info.widthUnit)
    writer.uint32(Math.round(info.vres * 0x10000))
    writer.uint16(info.vresUnit)
    writer.uint16(info.heightUnit)
  }

  writeLayerAndMaskInformation(psd: PSDData) {
    const {writer} = this
    writer.sizeBegin(4)
    this.writeLayerInfo(psd)
    this.writeGlobalLayerMaskInfo()
    writer.sizeEnd()
  }

  writeLayerInfo(psd: PSDData) {
    const {writer} = this
    writer.sizeBegin(4)
    const layerCount = psd.imageDataHasAlpha ? -psd.layerRecords.length : psd.layerRecords.length
    writer.int16(layerCount)
    for (const record of psd.layerRecords) {
      this.writeLayerRecord(record)
    }
    for (const record of psd.layerRecords) {
      this.writeChannelImageData(record, psd.depth)
    }
    writer.sizeEnd()
  }

  writeLayerRecord(record: PSDLayerRecord) {
    const {writer} = this

    writer.uint32(record.rect.top)
    writer.uint32(record.rect.left)
    writer.uint32(record.rect.bottom)
    writer.uint32(record.rect.right)
    writer.uint16(record.channelInfos.length)
    for (let i = 0; i < record.channelInfos.length; ++i) {
      writer.int16(record.channelInfos[i].id)
      writer.uint32(record.channelDatas[i].length + 2)
    }
    writer.ascii('8BIM', 4)
    writer.ascii(record.blendMode, 4)
    writer.uint8(Math.round(record.opacity * 255))
    writer.uint8(record.clipping ? 1 : 0)

    let flags = 0
    if (record.transparencyProtected) {
      flags |= 1
    }
    if (!record.visible) {
      flags |= (1 << 1)
    }
    writer.uint8(flags)
    writer.zeroes(1)

    // extra data field
    writer.sizeBegin(4)

    this.writeLayerMaskData()
    this.writeLayerBlendingRangesData()
    writer.pascalString('Layer', 4)
    this.writeAdditionalLayerInfo(record)

    writer.sizeEnd()
  }

  writeLayerMaskData() {
    this.writer.uint32(0)
  }
  writeLayerBlendingRangesData() {
    this.writer.uint32(0)
  }
  writeAdditionalLayerInfo(record: PSDLayerRecord) {
    const {writer} = this
    const writeInfo = (key: PSDAdditionalLayerInfoKey, writeData: () => void) => {
      writer.ascii('8BIM', 4)
      writer.ascii(key, 4)
      writer.sizeBegin(4)
      writeData()
      writer.sizeEnd()
    }
    writeInfo('lsct', () => {
      writer.uint32(record.sectionType)
    })
    writeInfo('luni', () => {
      writer.unicodePascalString(record.name)
    })
  }

  writeChannelImageData(record: PSDLayerRecord, depth: number) {
    const correctSize = record.rect.width * record.rect.height * depth / 8
    for (const data of record.channelDatas) {
      if (data.length !== correctSize) {
        throw new Error('Channel data size is wrong')
      }
      this.writeImageData(data)
    }
  }

  writeGlobalLayerMaskInfo() {
    this.writer.uint32(0)
  }

  writeImageData(data: Buffer) {
    const {writer} = this
    writer.uint16(PSDCompression.Raw)
    writer.buffer(data)
  }

  writeImageDataSection(psd: PSDData) {
    if (psd.imageData.length !== psd.width * psd.height * psd.channelCount * psd.depth / 8) {
      throw new Error('Image data size is wrong')
    }
    this.writeImageData(psd.imageData)
  }
}
