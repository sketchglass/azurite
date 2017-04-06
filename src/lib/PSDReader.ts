import {Readable} from "stream"
import BinaryReader from "./BinaryReader"

interface PSDReaderVisitor {
}

export
enum PSDColorMode {
  Bitmap = 0,
  Grayscale = 1,
  Indexed = 2,
  RGB = 3,
  CMYK = 4,
  Multichannel = 7,
}

// https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/
export default
class PSDReader {
  reader = new BinaryReader(this.readable)
  numberOfChannels: number
  height: number
  width: number
  depth: number
  colorMode: PSDColorMode

  constructor(public readable: Readable, public visitor: PSDReaderVisitor) {
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
}