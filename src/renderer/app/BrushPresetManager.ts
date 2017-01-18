import {observable} from "mobx"
import {BrushPreset} from "../brush/BrushPreset"

export
class BrushPresetManager {
  readonly presets = observable<BrushPreset>([])
}

export const brushPresetManager = new BrushPresetManager()
