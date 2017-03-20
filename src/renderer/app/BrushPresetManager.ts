import {observable, computed} from "mobx"
import {BrushPreset} from "../brush/BrushPreset"
import {ConfigValues} from "./Config"
import {defaultBrushPresets} from "../brush/DefaultBrushPresets"

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
    const presetsData = values.brushPresets.length > 0 ? values.brushPresets : defaultBrushPresets()
    this.presets.clear()
    for (const data of presetsData) {
      const preset = new BrushPreset(data)
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
