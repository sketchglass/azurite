import {PSDData, PSDLayerRecord} from './PSDTypes'

function premultiply(dst: Float32Array, area: number) {
  for (let i = 0; i < area; ++i) {
    const a = dst[i * 4 + 3]
    dst[i * 4] *= a
    dst[i * 4 + 1] *= a
    dst[i * 4 + 2] *= a
  }
}

function unmultiply(dst: Float32Array, area: number) {
  for (let i = 0; i < area; ++i) {
    const a = dst[i * 4 + 3]
    if (a >= 0.001) {
      dst[i * 4] /= a
      dst[i * 4 + 1] /= a
      dst[i * 4 + 2] /= a
    }
  }
}

function setChannelData(dst: Float32Array, depth: 8|16|32, area: number, ch: number, src: Buffer) {
  if (depth === 32) {
    for (let i = 0; i < area; ++i) {
      dst[i * 4 + ch] = src.readUInt32BE(i * 4) / 0xFFFFFFFF
    }
  } else if (depth === 16) {
    for (let i = 0; i < area; ++i) {
      dst[i * 4 + ch] = src.readUInt16BE(i * 2) / 0xFFFF
    }
  } else {
    for (let i = 0; i < area; ++i) {
      dst[i * 4 + ch] = src.readUInt8(i) / 0xFF
    }
  }
}

export
function channelDataToFloatRGBA(psd: PSDData, layerRecord: PSDLayerRecord) {
  const {depth} = psd
  if (depth === 1) {
    throw new Error('binary image is not supported')
  }
  const {channelInfos, channelDatas, rect} = layerRecord
  const area = rect.width * rect.height
  const dst = new Float32Array(area * 4)

  for (const [i, channelInfo] of channelInfos.entries()) {
    let ch: number
    if (channelInfo.id >= 0) { // RGB
      ch = channelInfo.id
    } else if (channelInfo.id === -1) { // alpha
      ch = 3
    } else {
      continue
    }
    setChannelData(dst, depth, area, ch, channelDatas[i])
  }

  premultiply(dst, area)
  return dst
}

export
function imageDataToFloatRGBA(psd: PSDData) {
  const {channelCount, depth} = psd
  if (depth === 1) {
    throw new Error('binary image is not supported')
  }
  const area = psd.width * psd.height
  const dst = new Float32Array(area * 4)
  const src = psd.imageData

  for (let ch = 0; ch < 4; ++ch) {
    if (ch < channelCount) {
      const depthByte = depth / 8
      const channelSrc = src.slice(area * ch * depthByte, area * (ch + 1) * depthByte)
      setChannelData(dst, depth, area, ch, channelSrc)
    } else {
      for (let i = 0; i < area; ++i) {
        dst[i * 4 + ch] = 1
      }
    }
  }

  premultiply(dst, area)
  return dst
}

export function floatRGBAToChannelData16(src: Float32Array, width: number, height: number) {
  const area = width * height
  unmultiply(src, area)
  const channelDatas: Buffer[] = []
  for (let ch = 0; ch < 4; ++ch) {
    const channelData = Buffer.alloc(area * 2)
    for (let i = 0; i < area; ++i) {
      const value = Math.round(src[i * 4 + ch] * 0xFF)
      channelData.writeUInt16BE(value, i * 2)
    }
    channelDatas.push(channelData)
  }
  return channelDatas
}

export function floatRGBAToImageData16(src: Float32Array, width: number, height: number) {
  const area = width * height
  unmultiply(src, area)
  const imageData = Buffer.alloc(area * 2 * 4)
  for (let ch = 0; ch < 4; ++ch) {
    const offset = ch * area * 2
    for (let i = 0; i < area; ++i) {
      const value = Math.round(src[i * 4 + ch] * 0xFF)
      imageData.writeUInt16BE(value, offset + i * 2)
    }
  }
  return imageData
}
