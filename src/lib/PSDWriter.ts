import * as iconv from 'iconv-lite'

class PSDBinaryWriter {
  offset = 0
  savedOffsets: number[] = []
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
  sizeBegin() {
    this.savedOffsets.push(this.offset)
  }
  sizeEnd() {
    const lastOffset = this.savedOffsets.pop()
    if (lastOffset == undefined) {
      throw new Error('cannot pop offset')
    }
    return this.offset - lastOffset
  }
}

export default
class PSDWriter {
  writer = new PSDBinaryWriter()
}