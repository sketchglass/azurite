import {Vec2, Rect} from "paintvec"

export function getBoundingRect(data: Int32Array, size: Vec2) {
  const {width, height} = size
  const stride = Math.ceil(width / 32)
  const verticalOrs = new Int32Array(stride)
  let left = -1, right = -1, top = -1, bottom = -1
  let i = 0
  for (let y = 0; y < height; ++y) {
    let horizontalOr = 0
    for (let x = 0; x < stride; ++x) {
      const value = data[i++]
      verticalOrs[x] |= value
      horizontalOr |= value
    }
    if (horizontalOr) {
      if (top < 0) {
        top = y
      }
      bottom = y
    }
  }
  i = 0
  let mask = 1
  for (let x = 0; x < width; ++x) {
    if (verticalOrs[i] & mask) {
      if (left < 0) {
        left = x
      }
      right = x
    }
    mask <<= 1
    if (mask == 0) {
      ++i
      mask = 1
    }
  }
  if (left >= 0 && top >= 0) {
    return new Rect(new Vec2(left, top), new Vec2(right + 1, bottom + 1))
  }
}
