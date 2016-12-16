import {Vec2, Rect} from "paintvec"

export function getBoundingRect(imageData: Uint8Array, size: Vec2) {
  const {width, height} = size

  let hasOpaquePixel = false
  let left = 0, right = 0, top = 0, bottom = 0
  let i = 3
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      const a = imageData[i]
      i += 4
      if (a != 0) {
        if (hasOpaquePixel) {
          left = Math.min(left, x)
          right = Math.max(right, x + 1)
          top = Math.min(top, y)
          bottom = Math.max(bottom, y + 1)
        } else {
          hasOpaquePixel = true
          left = x
          right = x + 1
          top = y
          bottom = y + 1
        }
      }
    }
  }
  if (hasOpaquePixel) {
    return new Rect(new Vec2(left, top), new Vec2(right, bottom))
  }
}