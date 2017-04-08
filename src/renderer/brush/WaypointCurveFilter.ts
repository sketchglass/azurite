import {WaypointFilter, WaypointConsumer} from './BrushPipeline'
import {Waypoint} from './Waypoint'

export class WaypointCurveFilter implements WaypointFilter {
  lastWaypoints: Waypoint[] = []
  outlet: WaypointConsumer
  brushSpacing = (wp: Waypoint) => 1
  nextDabOffset = 0

  nextWaypoints(waypoints: Waypoint[]) {
    for (const wp of waypoints) {
      this.nextWaypoint(wp)
    }
  }

  nextWaypoint(waypoint: Waypoint) {
    const {lastWaypoints, brushSpacing} = this
    if (lastWaypoints.length === 4) {
      lastWaypoints.shift()
    }
    lastWaypoints.push(waypoint)

    const {waypoints, nextOffset} = (() => {
      switch (lastWaypoints.length) {
        case 1:
          return {waypoints: [waypoint], nextOffset: this.brushSpacing(waypoint)}
        case 2:
          return {waypoints: [], nextOffset: this.nextDabOffset}
        case 3:
          return Waypoint.subdivideCurve(lastWaypoints[0], lastWaypoints[0], lastWaypoints[1], lastWaypoints[2], brushSpacing, this.nextDabOffset)
        default:
          return Waypoint.subdivideCurve(lastWaypoints[0], lastWaypoints[1], lastWaypoints[2], lastWaypoints[3], brushSpacing, this.nextDabOffset)
      }
    })()

    this.nextDabOffset = nextOffset

    if (waypoints.length !== 0) {
      this.outlet.nextWaypoints(waypoints)
    }
  }

  endWaypoint() {
    const {lastWaypoints, brushSpacing} = this
    if (lastWaypoints.length < 2) {
      return
    }
    const {waypoints} = (() => {
      if (lastWaypoints.length === 2) {
        return Waypoint.subdivide(lastWaypoints[0], lastWaypoints[1], brushSpacing, this.nextDabOffset)
      } else if (lastWaypoints.length === 3) {
        return Waypoint.subdivideCurve(lastWaypoints[0], lastWaypoints[1], lastWaypoints[2], lastWaypoints[2], brushSpacing, this.nextDabOffset)
      } else {
        return Waypoint.subdivideCurve(lastWaypoints[1], lastWaypoints[2], lastWaypoints[3], lastWaypoints[3], brushSpacing, this.nextDabOffset)
      }
    })()

    if (waypoints.length !== 0) {
      this.outlet.nextWaypoints(waypoints)
    }
    this.outlet.endWaypoint()
    this.lastWaypoints = []
    this.nextDabOffset = 0
  }
}
