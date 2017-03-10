import {Waypoint} from "./Waypoint"

export interface WaypointConsumer {
  nextWaypoints(waypoints: Waypoint[]): void
  endWaypoint(): void
}

export interface WaypointFilter extends WaypointConsumer {
  outlet: WaypointConsumer
}

export class BrushPipeline implements WaypointConsumer {
  constructor(public waypointFilters: WaypointFilter[], public renderer: WaypointConsumer) {
    for (let i = 0; i < waypointFilters.length - 1; ++i) {
      waypointFilters[i].outlet = waypointFilters[i + 1]
    }
    waypointFilters[waypointFilters.length - 1].outlet = renderer
  }

  nextWaypoints(waypoints: Waypoint[]) {
    this.waypointFilters[0].nextWaypoints(waypoints)
  }

  endWaypoint() {
    this.waypointFilters[0].endWaypoint()
  }
}
