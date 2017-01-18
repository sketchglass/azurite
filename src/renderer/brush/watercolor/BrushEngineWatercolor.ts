import {BrushEngine} from "../BrushEngine"
import {BrushPresetData} from "../BrushPreset"
import {BrushPresetWatercolor, isPresetDataWatercolor} from "./BrushPresetWatercolor"
import {DabRendererWatercolor} from "./DabRendererWatercolor"

export class BrushEngineWatercolor extends BrushEngine {
  newDabRenderer() {
    return new DabRendererWatercolor(this.newPreset())
  }

  newPreset() {
    return new BrushPresetWatercolor({
      title: "Watercolor",
      width: 10,
      opacity: 1,
      softness: 0.5,
      minWidthRatio: 0.5,
      stabilizingLevel: 2,
      blending: 0.5,
      thickness: 0.5,
    })
  }

  maybeNewPresetFromData(data: BrushPresetData) {
    if (isPresetDataWatercolor(data)) {
      return new BrushPresetWatercolor(data)
    }
  }
}
