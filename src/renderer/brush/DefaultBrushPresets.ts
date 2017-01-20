import {BrushPresetData} from "./BrushPreset"
import {BrushPresetPenData} from "./pen/BrushPresetPen"
import {BrushPresetWatercolorData} from "./watercolor/BrushPresetWatercolor"

export function defaultBrushPresets(): BrushPresetData[] {
  const presets: (BrushPresetPenData|BrushPresetWatercolorData)[] = [
    {
      engine: "pen",
      title: "Pen",
      width: 10,
      opacity: 1,
      softness: 0.5,
      minWidthRatio: 0.5,
      stabilizingLevel: 2,
      eraser: false,
    },
    {
      engine: "watercolor",
      title: "Watercolor",
      width: 10,
      opacity: 1,
      softness: 0.5,
      minWidthRatio: 1,
      stabilizingLevel: 2,
      blending: 0.5,
      thickness: 0.5,
    },
    {
      engine: "pen",
      title: "Eraser",
      width: 10,
      opacity: 1,
      softness: 0.5,
      minWidthRatio: 0.5,
      stabilizingLevel: 2,
      eraser: true,
    },
  ]
  return presets
}
