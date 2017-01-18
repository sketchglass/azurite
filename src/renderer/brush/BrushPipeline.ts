import {Waypoint} from "./Waypoint"
import {DabRenderer} from "./DabRenderer"

export interface WaypointConsumer {
  nextWaypoints(waypoints: Waypoint[]): void
  endWaypoint(): void
}

export interface WaypointFilter extends WaypointConsumer {
  outlet: WaypointConsumer
}

export class BrushPipeline implements WaypointConsumer {
  constructor(public waypointFilters: WaypointFilter[], public dabRenderer: DabRenderer) {
    for (let i = 0; i < waypointFilters.length - 1; ++i) {
      waypointFilters[i].outlet = waypointFilters[i + 1]
    }
    waypointFilters[waypointFilters.length - 1].outlet = dabRenderer
  }

  nextWaypoints(waypoints: Waypoint[]) {
    this.waypointFilters[0].nextWaypoints(waypoints)
  }

  endWaypoint() {
    this.waypointFilters[0].endWaypoint()
  }
}
