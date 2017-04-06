import {Readable} from "stream"
import * as iconv from "iconv-lite"

export default
class BinaryReader {
  constructor(public readable: Readable) {
  }
  skip(size: number) {
    this.readable.read(size)
  }
  ascii(count: number) {
    const buf = this.readable.read(count) as Buffer
    return buf.toString('ascii')
  }
  utf8LE(count: number) {
    const buf = this.readable.read(count * 2) as Buffer
    return buf.toString('utf16le')
  }
  utf8BE(count: number) {
    const buf = this.readable.read(count * 2) as Buffer
    return iconv.decode(buf, 'utf16-be')
  }
  int8() {
    const buf = this.readable.read(1) as Buffer
    return buf.readInt8(0)
  }
  uint8() {
    const buf = this.readable.read(1) as Buffer
    return buf.readUInt8(0)
  }
  int16LE() {
    const buf = this.readable.read(2) as Buffer
    return buf.readInt16LE(0)
  }
  int16BE() {
    const buf = this.readable.read(2) as Buffer
    return buf.readInt16BE(0)
  }
  uint16LE() {
    const buf = this.readable.read(2) as Buffer
    return buf.readUInt16LE(0)
  }
  uint16BE() {
    const buf = this.readable.read(2) as Buffer
    return buf.readUInt16BE(0)
  }
  int32LE() {
    const buf = this.readable.read(4) as Buffer
    return buf.readInt32LE(0)
  }
  int32BE() {
    const buf = this.readable.read(4) as Buffer
    return buf.readInt32BE(0)
  }
  uint32LE() {
    const buf = this.readable.read(4) as Buffer
    return buf.readUInt32LE(0)
  }
  uint32BE() {
    const buf = this.readable.read(4) as Buffer
    return buf.readUInt32BE(0)
  }
  floatLE() {
    const buf = this.readable.read(4) as Buffer
    return buf.readFloatLE(0)
  }
  floatBE() {
    const buf = this.readable.read(4) as Buffer
    return buf.readFloatBE(0)
  }
  doubleLE() {
    const buf = this.readable.read(8) as Buffer
    return buf.readDoubleLE(0)
  }
  doubleBE() {
    const buf = this.readable.read(8) as Buffer
    return buf.readDoubleBE(0)
  }
}
