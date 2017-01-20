import {BrushEngine} from "../BrushEngine"
import {BrushPresetData} from "../BrushPreset"
import {BrushPresetPen, isPresetDataPen} from "./BrushPresetPen"
import {DabRendererPen} from "./DabRendererPen"
import {addBrushEngine} from "../../app/BrushEngineRegistry"

@addBrushEngine
export class BrushEnginePen extends BrushEngine {
  newDabRenderer() {
    return new DabRendererPen(this.newPreset())
  }

  newPreset() {
    return new BrushPresetPen(this, {
      title: "Pen",
      width: 10,
      opacity: 1,
      softness: 0.5,
      minWidthRatio: 0.5,
      stabilizingLevel: 2,
      eraser: false,
    })
  }

  maybeNewPresetFromData(data: BrushPresetData) {
    if (isPresetDataPen(data)) {
      return new BrushPresetPen(this, data)
    }
  }
}
