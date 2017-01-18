import {BrushPreset, BrushPresetData} from "./BrushPreset"
import {DabRenderer} from "./DabRenderer"
import {BrushPipeline} from "./BrushPipeline"
import {WaypointCurveFilter} from "./WaypointCurveFilter"
import {WaypointStabilizeFilter} from "./WaypointStabilizeFilter"

export abstract class BrushEngine {
  abstract newDabRenderer(): DabRenderer
  abstract newPreset(): BrushPreset
  abstract maybeNewPresetFromData(data: BrushPresetData): BrushPreset|undefined

  newPipeline() {
    return new BrushPipeline(
      [new WaypointStabilizeFilter(), new WaypointCurveFilter()],
      this.newDabRenderer()
    )
  }
}
