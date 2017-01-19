import {observable, computed} from "mobx"
import {BrushPreset} from "../brush/BrushPreset"
import {ConfigValues} from "./Config"
import {brushEngineRegistry} from "./BrushEngineRegistry"

export
class BrushPresetManager {
  readonly presets = observable<BrushPreset>([])
  @observable currentPresetIndex = 0

  @computed get currentPreset() {
    const i = this.currentPresetIndex
    if (i < this.presets.length) {
      return this.presets[i]
    }
  }

  loadConfig(values: ConfigValues) {
    this.presets.clear()
    for (const data of values.brushPresets) {
      const preset = brushEngineRegistry.createPreset(data)
      if (preset) {
        this.presets.push(preset)
      }
    }
    this.currentPresetIndex = values.currentBrushPreset
  }

  saveConfig() {
    return {
      brushPresets: this.presets.map(p => p.toData()),
      currentBrushPreset: this.currentPresetIndex,
    }
  }
}

export const brushPresetManager = new BrushPresetManager()
