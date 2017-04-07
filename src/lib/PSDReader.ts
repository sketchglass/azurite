import {Readable} from "stream"
import BinaryReader from "./BinaryReader"
import {PSDColorMode, PSDLayerInfo, PSDChannelInfo, PSDBlendModeKey, PSDSectionType} from "./PSDTypes"
import {Rect, Vec2} from "paintvec"

// https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/
export default
class PSDReader {
  reader = new BinaryReader(this.readable)
  numberOfChannels: number
  height: number
  width: number
  depth: number
  colorMode: PSDColorMode
  numberOfLayers: number
  layerInfos: PSDLayerInfo[] = []

  constructor(public readable: Readable) {
  }

  readFileHeader() {
    const {reader} = this
    const signature = reader.ascii(4)
    if (signature != '8BPS') {
      throw new Error('Wrong signature')
    }
    const version = reader.uint16BE()
    if (version != 1) {
      // TODO: PSB support
      throw new Error('Unsupported version')
    }
    reader.skip(6)
    this.numberOfChannels = reader.uint16BE()
    this.height = reader.uint32BE()
    this.width = reader.uint32BE()
    this.depth = reader.uint16BE()
    this.colorMode = reader.uint16BE()
  }

  readColorModeData() {
    const {reader} = this
    const len = reader.uint32BE()
    reader.skip(len) // TODO
  }

  readImageResouces() {
    const {reader} = this
    const len = reader.uint32BE()
    reader.skip(len) // TODO
  }

  readLayerAndMasInformation() {
    const {reader} = this
    reader.uint32BE() // length
    this.readLayerInfo()
  }

  readLayerInfo() {
    const {reader} = this
    reader.uint32BE() // length
    this.numberOfLayers = reader.uint16BE()
    this.readLayerRecords()
    this.readChannelImageData()
  }

  readLayerRecords() {
    for (let i = 0; i < this.numberOfLayers; ++i) {
      this.readLayerRecord()
    }
  }

  readLayerRecord(): PSDLayerInfo {
    const {reader} = this
    const top = reader.uint32BE()
    const left = reader.uint32BE()
    const bottom = reader.uint32BE()
    const right = reader.uint32BE()
    const rect = new Rect(new Vec2(left, top), new Vec2(right, bottom))
    const channelCount = reader.uint16BE()
    const channelInfos: PSDChannelInfo[] = []
    for (let i = 0; i < channelCount; ++i) {
      channelInfos.push({
        id: reader.uint16BE(),
        dataLength: reader.uint32BE(),
      })
    }
    const blendModeSig = reader.ascii(4)
    if (blendModeSig != '8BIM') {
      throw new Error('Blend mode signature is wrong')
    }
    const blendMode = reader.ascii(4) as PSDBlendModeKey
    const opacity = reader.uint8()
    const clipping = reader.uint8() === 1
    const flags = reader.uint8()
    const transparencyProtected = (flags & 1) !== 0
    const visible = (flags & (1 << 1)) !== 0
    reader.skip(1) // filler
    const extraDataFieldLength = reader.uint32BE()
    reader.buffer(extraDataFieldLength) // TODO

    return {
      name: '', // TODO
      opacity,
      clipping,
      transparencyProtected,
      visible,
      rect,
      blendMode,
      sectionType: PSDSectionType.Layer, // TODO
      channelInfos,
      channelDatas: [], // TODO
    }
  }

  readChannelImageData() {
  }
}