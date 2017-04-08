import {BrushPresetData} from './BrushPreset'

export function defaultBrushPresets(): BrushPresetData[] {
  return [
    {
      title: 'Pen',
      type: 'normal',
      width: 10,
      opacity: 1,
      blending: 0,
      softness: 0.5,
      minWidthRatio: 0.5,
      minOpacityRatio: 1,
      stabilizingLevel: 2,
      shortcut: {modifiers: [], code: 'KeyB'},
    },
    {
      title: 'Watercolor',
      type: 'normal',
      width: 10,
      opacity: 1,
      blending: 0.5,
      softness: 0.5,
      minWidthRatio: 1,
      minOpacityRatio: 0,
      stabilizingLevel: 2,
      shortcut: {modifiers: [], code: 'KeyW'},
    },
    {
      title: 'Eraser',
      type: 'eraser',
      width: 10,
      opacity: 1,
      blending: 0.5,
      softness: 0.5,
      minWidthRatio: 0.5,
      minOpacityRatio: 1,
      stabilizingLevel: 2,
      shortcut: {modifiers: [], code: 'KeyE'},
    },
  ]
}
