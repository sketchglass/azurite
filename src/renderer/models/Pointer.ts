import {Point} from "../../lib/Geometry"

export default
class Pointer {
  constructor(public pos: Point, public pressure: number) {
  }

  static interpolate(start: Pointer, end: Pointer, offset: number) {
    const diff = end.pos.sub(start.pos)
    const len = diff.length()
    if (len == 0) {
      return {
        pointers: [],
        nextOffset: 0
      }
    }

    const count = Math.floor(len - offset)
    const pointers: Pointer[] = []
    const diffPerLen = diff.div(len)
    const pressurePerLen = (end.pressure - start.pressure) / len

    for (let i = 0; i < count; ++i) {
      const current = offset + i
      const pos = start.pos.add(diffPerLen.mul(current))
      const pressure = start.pressure + pressurePerLen * current
      pointers.push({pos, pressure})
    }
    const remaining = len - (count - 1) - offset

    return {
      pointers,
      nextOffset: 1 - remaining
    }
  }
}
