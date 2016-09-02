import {Vec2} from "../../lib/Geometry"

export default
class Waypoint {
  constructor(public pos: Vec2, public pressure: number) {
  }

  static interpolate(start: Waypoint, end: Waypoint, getNextSpacing: (waypoint: Waypoint) => number, offset: number) {
    const diff = end.pos.sub(start.pos)
    const len = diff.length()
    if (len == 0) {
      return {
        waypoints: [],
        nextOffset: 0
      }
    }

    const waypoints: Waypoint[] = []
    const diffPerLen = diff.div(len)
    const pressurePerLen = (end.pressure - start.pressure) / len
    let remaining = len
    let spacing = offset

    while (true) {
      if (remaining < spacing) {
        return {
          waypoints,
          nextOffset: spacing - remaining
        }
      }
      remaining -= spacing
      const current = len - remaining
      const pos = start.pos.add(diffPerLen.mul(current))
      const pressure = start.pressure + pressurePerLen * current
      const waypoint = {pos, pressure}
      waypoints.push(waypoint)
      spacing = Math.max(getNextSpacing(waypoint), 1)
    }
  }
}
