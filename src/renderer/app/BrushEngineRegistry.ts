import {BrushEngine} from "../brush/BrushEngine"
import {BrushPresetData} from "../brush/BrushPreset"

export
class BrushEngineRegistry {
  readonly engines: BrushEngine[] = []

  createPreset(data: BrushPresetData) {
    for (const engine of this.engines) {
      const preset = engine.maybeNewPresetFromData(data)
      if (preset) {
        return preset
      }
    }
  }
}

export const brushEngineRegistry = new BrushEngineRegistry()

export function addBrushEngine(klass: {new(): BrushEngine}) {
  brushEngineRegistry.engines.push(new klass())
}
