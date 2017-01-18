import {observable} from "mobx"
import {BrushPreset} from "../brush/BrushPreset"
import {ConfigValues} from "./Config"

export
class BrushPresetManager {
  readonly presets = observable<BrushPreset>([])

  loadConfig(values: ConfigValues) {
    // TODO
  }

  saveConfig() {
    return {
      brushPresets: this.presets.map(p => p.toData())
    }
  }
}

export const brushPresetManager = new BrushPresetManager()
