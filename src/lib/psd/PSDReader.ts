import * as iconv from 'iconv-lite'
import {Rect, Vec2} from 'paintvec'
import {
  PSDColorMode,
  PSDLayerRecord,
  PSDChannelInfo,
  PSDBlendModeKey,
  PSDSectionType,
  PSDAdditionalLayerInfoKey,
  PSDCompression,
  PSDImageResourceID,
  PSDResolutionUnit,
  PSDDimensionUnit,
  PSDResolutionInfo,
  PSDDepth,
  PSDData,
} from './PSDTypes'

class PSDBinaryReader {
  offset = 0
  savedOffsets: number[] = []
  constructor(public data: Buffer) {
  }
  buffer(size: number)  {
    const buf = this.data.slice(this.offset, this.offset + size)
    this.offset += size
    return buf
  }
  skip(size: number) {
    this.offset += size
  }
  uint8() {
    const i = this.offset
    ++this.offset
    return this.data.readUInt8(i)
  }
  uint16() {
    const i = this.offset
    this.offset += 2
    return this.data.readUInt16BE(i)
  }
  int16() {
    const i = this.offset
    this.offset += 2
    return this.data.readInt16BE(i)
  }
  uint32() {
    const i = this.offset
    this.offset += 4
    return this.data.readUInt32BE(i)
  }
  ascii(count: number) {
    const buf = this.buffer(count)
    return buf.toString('ascii')
  }
  utf16(count: number) {
    const buf = this.buffer(count * 2)
    return iconv.decode(buf, 'utf16-be')
  }
  pascalString(alignment: number) {
    const count = this.uint8()
    const totalCount = count + 1
    const alignedCount = Math.ceil(totalCount / alignment) * alignment
    const str = this.ascii(count)
    this.skip(alignedCount - totalCount)
    return str
  }
  unicodePascalString() {
    const count = this.uint32()
    return this.utf16(count)
  }
  pushOffset() {
    this.savedOffsets.push(this.offset)
  }
  popOffset() {
    const offset = this.savedOffsets.pop()
    if (offset == undefined) {
      throw new Error('cannot pop offset')
    }
    this.offset = offset
  }
}

function decodePackBits(src: Buffer, dst: Buffer) {
  let i = 0
  let j = 0
  while (i < src.length) {
    const count = src.readInt8(i)
    ++i
    if (0 <= count) {
      const len = count + 1
      dst.set(src.slice(i, i + len), j)
      i += len
      j += len
    } else if (count === -128) {
      // do nothing
    } else {
      const c = src[i]
      const len = -count + 1
      dst.fill(c, j, j + len)
      ++i
      j += len
    }
  }
  return dst
}

// https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/
export default
class PSDReader {
  reader = new PSDBinaryReader(this.data)

  constructor(public data: Buffer) {
  }

  read(): PSDData {
    const {channelCount, height, width, depth, colorMode} = this.readFileHeader()
    this.readColorModeData()
    const {resolutionInfo} =  this.readImageResouces()
    const {imageDataHasAlpha, layerRecords} = this.readLayerAndMasInformation()
    const imageData = this.readImageDataSection(width, height, channelCount)
    return {
      channelCount, height, width, depth, colorMode, resolutionInfo,
      imageDataHasAlpha, layerRecords, imageData
    }
  }

  readFileHeader() {
    const {reader} = this
    const signature = reader.ascii(4)
    if (signature !== '8BPS') {
      throw new Error('Wrong signature')
    }
    const version = reader.uint16()
    if (version !== 1) {
      // TODO: PSB support
      throw new Error('Unsupported version')
    }
    reader.skip(6)
    return {
      channelCount: reader.uint16(),
      height: reader.uint32(),
      width: reader.uint32(),
      depth: reader.uint16() as PSDDepth,
      colorMode: reader.uint16() as PSDColorMode,
    }
  }

  readColorModeData() {
    const {reader} = this
    const len = reader.uint32()
    reader.skip(len) // TODO
  }

  readImageResouces() {
    const {reader} = this
    const len = reader.uint32()
    reader.pushOffset()

    let resolutionInfo: PSDResolutionInfo|undefined

    while (true) {
      const signature = reader.ascii(4)
      if (signature !== '8BIM') {
        break
      }
      const id = reader.uint16()
      const name = reader.pascalString(2)
      const size = reader.uint32()
      reader.pushOffset()
      if (id === PSDImageResourceID.ResolutionInfo) {
        resolutionInfo = this.readResolutionInfo()
      }
      reader.popOffset()
      reader.skip(size)
      console.log(id, name)
    }

    reader.popOffset()
    reader.skip(len) // TODO

    return {resolutionInfo}
  }

  readResolutionInfo(): PSDResolutionInfo {
    const {reader} = this
    const hres = reader.uint32() / 0x10000
    const hresUnit = reader.uint16() as PSDResolutionUnit
    const widthUnit = reader.uint16() as PSDDimensionUnit
    const vres = reader.uint32() / 0x10000
    const vresUnit = reader.uint16() as PSDResolutionUnit
    const heightUnit = reader.uint16() as PSDDimensionUnit
    const resolutionInfo = {
      hres, hresUnit, widthUnit, vres, vresUnit, heightUnit
    }
    console.log(resolutionInfo)
    return resolutionInfo
  }

  readLayerAndMasInformation() {
    const {reader} = this
    const len = reader.uint32()
    reader.pushOffset()

    const result = this.readLayerInfo()

    reader.popOffset()
    reader.skip(len)

    return result
  }

  readLayerInfo() {
    const {reader} = this
    const len = reader.uint32()
    reader.pushOffset()

    const layerCount = reader.int16()
    const imageDataHasAlpha = layerCount < 0
    const layerRecords = this.readLayerRecords(Math.abs(layerCount))
    this.readChannelImageDatas(layerRecords)

    reader.popOffset()
    reader.skip(len)

    return {imageDataHasAlpha, layerRecords}
  }

  readLayerRecords(layerCount: number) {
    const layerRecords: PSDLayerRecord[] = []
    for (let i = 0; i < layerCount; ++i) {
      layerRecords.push(this.readLayerRecord())
    }
    return layerRecords
  }

  readLayerRecord(): PSDLayerRecord {
    const {reader} = this

    const top = reader.uint32()
    const left = reader.uint32()
    const bottom = reader.uint32()
    const right = reader.uint32()

    const rect = new Rect(new Vec2(left, top), new Vec2(right, bottom))

    const channelCount = reader.uint16()
    const channelInfos: PSDChannelInfo[] = []
    for (let i = 0; i < channelCount; ++i) {
      channelInfos.push({
        id: reader.int16(),
        dataLength: reader.uint32(),
      })
    }

    const blendModeSig = reader.ascii(4)
    if (blendModeSig !== '8BIM') {
      throw new Error('Blend mode signature is wrong')
    }

    const blendMode = reader.ascii(4) as PSDBlendModeKey
    const opacity = reader.uint8() / 255
    const clipping = reader.uint8() === 1
    const flags = reader.uint8()
    const transparencyProtected = (flags & 1) !== 0
    const visible = (flags & (1 << 1)) === 0

    reader.skip(1) // filler

    const extraDataFieldLength = reader.uint32()
    reader.pushOffset()

    this.readLayerMaskData()
    this.readLayerBlendingRangesData()
    const name = reader.pascalString(4)
    const {sectionType, unicodeName} = this.readAdditionalLayerInfo()

    reader.popOffset()
    reader.skip(extraDataFieldLength)

    const record = {
      name: unicodeName != undefined ? unicodeName : name,
      opacity,
      clipping,
      transparencyProtected,
      visible,
      rect,
      blendMode,
      sectionType,
      channelInfos,
      channelDatas: [],
    }
    console.log(record)
    return record
  }

  readLayerMaskData() {
    const {reader} = this
    const len = reader.uint32()
    reader.skip(len)
  }

  readLayerBlendingRangesData() {
    const {reader} = this
    const len = reader.uint32()
    reader.skip(len)
  }

  readAdditionalLayerInfo() {
    const {reader} = this
    let sectionType = PSDSectionType.Layer
    let unicodeName: string|undefined
    while (true) {
      const signature = reader.ascii(4)
      if (signature !== '8BIM' && signature !== '8B64') {
        break
      }
      const key = reader.ascii(4) as PSDAdditionalLayerInfoKey
      const len = reader.uint32()
      reader.pushOffset()
      if (key === 'lsct') {
        // section type
        sectionType = reader.uint32() as PSDSectionType
      } else if (key === 'luni') {
        unicodeName = reader.unicodePascalString()
      }
      reader.popOffset()
      reader.skip(len)
    }
    return {sectionType, unicodeName}
  }

  readChannelImageDatas(layerRecords: PSDLayerRecord[]) {
    for (const record of layerRecords) {
      for (const channelInfo of record.channelInfos) {
        const data = this.readChannelImageData(channelInfo.dataLength, record.rect.width, record.rect.height)
        record.channelDatas.push(data)
      }
    }
  }

  readChannelImageData(length: number, width: number, height: number) {
    const {reader} = this
    reader.pushOffset()
    const data = this.readImageData(width, height)
    reader.popOffset()
    reader.skip(length)
    return data
  }

  readImageData(width: number, height: number) {
    const {reader} = this
    const compression = reader.uint16() as PSDCompression
    if (compression === PSDCompression.Raw) {
      return reader.buffer(width * height)
    } else if (compression === PSDCompression.RLE) {
      const scanlineLengths: number[] = []
      const data = Buffer.alloc(width * height)
      for (let y = 0; y < height; ++y) {
        scanlineLengths.push(reader.uint16())
      }
      for (let y = 0; y < height; ++y) {
        const src = reader.buffer(scanlineLengths[y])
        const dst = data.slice(y * width, (y + 1) * width)
        decodePackBits(src, dst)
      }
      return data
    } else {
      throw new Error('Zip-encoded channel data is not supported')
    }
  }

  readImageDataSection(width: number, height: number, channelCount: number) {
    return this.readImageData(width, height * channelCount)
  }
}
