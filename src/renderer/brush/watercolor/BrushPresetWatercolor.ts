import {observable} from "mobx"
import {BrushPreset, BrushPresetProps, BrushPresetData} from "../BrushPreset"

export interface BrushPresetWatercolorProps extends BrushPresetProps {
  blending: number
  thickness: number
}
export interface BrushPresetWatercolorData extends BrushPresetWatercolorProps, BrushPresetData {
  engine: "watercolor"
}
export function isPresetDataWatercolor(data: BrushPresetData): data is BrushPresetWatercolorData {
  return data.engine == "watercolor"
}

export class BrushPresetWatercolor extends BrushPreset implements BrushPresetWatercolorProps {
  @observable blending = 0.5
  @observable thickness = 0.5

  constructor(props: BrushPresetWatercolorProps) {
    super(props)
    this.blending = props.blending
    this.thickness = props.thickness
  }

  toData(): BrushPresetWatercolorData {
    const {width, opacity, softness, minWidthRatio, stabilizingLevel, blending, thickness} = this
    return {
      engine: "watercolor",
      width, opacity, softness, minWidthRatio, stabilizingLevel, blending, thickness
    }
  }
}
