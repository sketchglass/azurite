import {BrushEngine} from "../brush/BrushEngine"

export
class BrushEngineRegistry {
  readonly engines: BrushEngine[] = []
}

export const brushEngineRegistry = new BrushEngineRegistry()

export function addBrushEngine(klass: {new(): BrushEngine}) {
  brushEngineRegistry.engines.push(new klass())
}
