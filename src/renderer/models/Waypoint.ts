import {Vec2} from "../../lib/Geometry"

export default
class Waypoint {
  constructor(public pos: Vec2, public pressure: number) {
  }

  static interpolate(start: Waypoint, end: Waypoint, offset: number) {
    const diff = end.pos.sub(start.pos)
    const len = diff.length()
    if (len == 0) {
      return {
        waypoints: [],
        nextOffset: 0
      }
    }

    const count = Math.floor(len - offset)
    const waypoints: Waypoint[] = []
    const diffPerLen = diff.div(len)
    const pressurePerLen = (end.pressure - start.pressure) / len

    for (let i = 0; i < count; ++i) {
      const current = offset + i
      const pos = start.pos.add(diffPerLen.mul(current))
      const pressure = start.pressure + pressurePerLen * current
      waypoints.push({pos, pressure})
    }
    const remaining = len - (count - 1) - offset

    return {
      waypoints,
      nextOffset: 1 - remaining
    }
  }
}
