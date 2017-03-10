import {BrushPreset} from "./BrushPreset"
import {BrushRenderer} from "./BrushRenderer"
import {BrushPipeline} from "./BrushPipeline"
import {WaypointCurveFilter} from "./WaypointCurveFilter"
import {WaypointStabilizeFilter} from "./WaypointStabilizeFilter"

export class BrushEngine {
  private _preset = new BrushPreset({
    title: "Brush",
    type: "normal",
    width: 10,
    opacity: 1,
    blending: 0.5,
    softness: 0.5,
    minWidthRatio: 0.5,
    minOpacityRatio: 0.5,
    stabilizingLevel: 2,
    shortcut: undefined
  })
  renderer = new BrushRenderer(this._preset)
  pipeline = new BrushPipeline(
    [new WaypointStabilizeFilter(), new WaypointCurveFilter()],
    this.renderer
  )
  get preset() {
    return this._preset
  }
  set preset(preset: BrushPreset) {
    this._preset = preset
    this.renderer.preset = preset
  }
}
