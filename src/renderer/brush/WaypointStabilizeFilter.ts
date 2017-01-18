import {Vec2} from "paintvec"
import {Waypoint} from "./Waypoint"
import {WaypointFilter, WaypointConsumer} from "./BrushPipeline"

function stabilizeWaypoint(waypoints: Waypoint[], level: number, index: number) {
  const nWaypoints = waypoints.length
  let sumX = 0
  let sumY = 0
  let sumPressure = 0
  for (let i = index - level; i <= index + level; ++i) {
    const {pos: {x, y}, pressure} = waypoints[Math.max(0, Math.min(i, nWaypoints - 1))]
    sumX += x
    sumY += y
    sumPressure += pressure
  }
  const sumCount = level * 2 + 1
  const pos = new Vec2(sumX / sumCount, sumY / sumCount)
  const pressure = sumPressure / sumCount
  return new Waypoint(pos, pressure)
}

export class WaypointStabilizeFilter implements WaypointFilter {
  outlet: WaypointConsumer
  lastWaypoints: Waypoint[] = []
  stabilizingLevel = 2

  nextWaypoints(waypoints: Waypoint[]) {
    for (const wp of waypoints) {
      this.nextWaypoint(wp)
    }
  }

  nextWaypoint(waypoint: Waypoint) {
    const waypoints = this.lastWaypoints
    waypoints.push(waypoint)
    const level = this.stabilizingLevel
    const sumCount = level * 2 + 1
    if (sumCount == waypoints.length) {
      for (let i = 0; i < level; ++i) {
        this.outlet.nextWaypoints([stabilizeWaypoint(waypoints, level, i)])
      }
    }
    if (sumCount <= waypoints.length) {
      const i = waypoints.length - 1 - level
      this.outlet.nextWaypoints([stabilizeWaypoint(waypoints, level, i)])
    }
  }

  endWaypoint() {
    const waypoints = this.lastWaypoints
    const level = this.stabilizingLevel
    let firstUndrawnIndex = 0
    if (level * 2 + 1 <= waypoints.length) {
      firstUndrawnIndex = waypoints.length - level
    }
    for (let i = firstUndrawnIndex; i < waypoints.length; ++i) {
      this.outlet.nextWaypoints([stabilizeWaypoint(waypoints, level, i)])
    }
    this.outlet.endWaypoint()
    this.lastWaypoints = []
  }
}