import {observable, computed} from 'mobx'
import {BrushPreset} from '../brush/BrushPreset'
import {defaultBrushPresets} from '../brush/DefaultBrushPresets'
import {ConfigValues} from './Config'

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
    this.presets.replace(presetsData.map(data => new BrushPreset(data)))
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
