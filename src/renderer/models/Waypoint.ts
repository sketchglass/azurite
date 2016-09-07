import {Vec2, catmullRom, centripetalCatmullRom} from "../../lib/Geometry"

export default
class Waypoint {
  constructor(public pos: Vec2, public pressure: number) {
  }

  // interpolate between start and end with catmull-rom curve and subdivide
  static subdivideCurve(prev: Waypoint, start: Waypoint, end: Waypoint, next: Waypoint, getNextSpacing: (waypoint: Waypoint) => number, offset: number) {
    const [cx, cy] = centripetalCatmullRom(prev.pos, start.pos, end.pos, next.pos)
    const cp = catmullRom(prev.pressure, start.pressure, end.pressure, next.pressure)

    const waypoints: Waypoint[] = []
    let last = start
    let nextOffset = offset
    const pointCount = 100

    for (let i = 1; i <= pointCount; ++i) {
      const t = i / pointCount

      const x = cx.eval(t)
      const y = cy.eval(t)
      const p = cp.eval(t)

      const wp = new Waypoint(new Vec2(x, y), p)
      const result = this.subdivide(last, wp, getNextSpacing, nextOffset)
      nextOffset = result.nextOffset
      waypoints.push(...result.waypoints)
      last = wp
    }
    return {waypoints, nextOffset}
  }

  // subdivide segment into waypoints
  static subdivide(start: Waypoint, end: Waypoint, getNextSpacing: (waypoint: Waypoint) => number, offset: number) {
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
