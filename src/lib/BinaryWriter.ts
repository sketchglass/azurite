import {Writable} from "stream"

export default
class BinaryWriter {
  constructor(public writable: Writable) {
  }
  arrayBuffer(buf: ArrayBuffer) {
    this.writable.write(Buffer.from(buf))
  }
  string(string: string, encoding: string) {
    const buf = Buffer.from(string, encoding)
    this.writable.write(buf)
  }
  int8(value: number) {
    const buf = Buffer.alloc(1)
    buf.writeInt8(value, 0)
    this.writable.write(buf)
  }
  uint8(value: number) {
    const buf = Buffer.alloc(1)
    buf.writeUInt8(value, 0)
    this.writable.write(buf)
  }
  int16LE(value: number) {
    const buf = Buffer.alloc(2)
    buf.writeInt16LE(value, 0)
    this.writable.write(buf)
  }
  int16BE(value: number) {
    const buf = Buffer.alloc(2)
    buf.writeInt16BE(value, 0)
    this.writable.write(buf)
  }
  uint16LE(value: number) {
    const buf = Buffer.alloc(2)
    buf.writeUInt16LE(value, 0)
    this.writable.write(buf)
  }
  uint16BE(value: number) {
    const buf = Buffer.alloc(2)
    buf.writeUInt16BE(value, 0)
    this.writable.write(buf)
  }
  int32LE(value: number) {
    const buf = Buffer.alloc(4)
    buf.writeInt32LE(value, 0)
    this.writable.write(buf)
  }
  int32BE(value: number) {
    const buf = Buffer.alloc(4)
    buf.writeInt32BE(value, 0)
    this.writable.write(buf)
  }
  uint32LE(value: number) {
    const buf = Buffer.alloc(4)
    buf.writeUInt32LE(value, 0)
    this.writable.write(buf)
  }
  uint32BE(value: number) {
    const buf = Buffer.alloc(4)
    buf.writeUInt32BE(value, 0)
    this.writable.write(buf)
  }
  floatLE(value: number) {
    const buf = Buffer.alloc(4)
    buf.writeFloatLE(value, 0)
    this.writable.write(buf)
  }
  floatBE(value: number) {
    const buf = Buffer.alloc(4)
    buf.writeFloatBE(value, 0)
    this.writable.write(buf)
  }
  doubleLE(value: number) {
    const buf = Buffer.alloc(8)
    buf.writeDoubleLE(value, 0)
    this.writable.write(buf)
  }
  doubleBE(value: number) {
    const buf = Buffer.alloc(8)
    buf.writeDoubleBE(value, 0)
    this.writable.write(buf)
  }
}