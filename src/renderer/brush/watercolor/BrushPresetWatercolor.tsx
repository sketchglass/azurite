import * as React from "react"
import {observable} from "mobx"
import {BrushPreset, BrushPresetProps, BrushPresetData, BrushIconType} from "../BrushPreset"
import WatercolorSettings from "./WatercolorSettings"
import {BrushEngineWatercolor} from "./BrushEngineWatercolor"

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

  constructor(public engine: BrushEngineWatercolor, props: BrushPresetWatercolorProps) {
    super(engine, props)
    this.blending = props.blending
    this.thickness = props.thickness
  }

  clone() {
    return new BrushPresetWatercolor(this.engine, this.toProps())
  }

  toProps(): BrushPresetWatercolorProps {
    const {blending, thickness} = this
    return {...super.toProps(), blending, thickness}
  }

  toData(): BrushPresetWatercolorData {
    return {
      engine: "watercolor",
      ...this.toProps(),
    }
  }

  renderSettings() {
    return <WatercolorSettings preset={this} />
  }

  get iconType(): BrushIconType {
    return "paint-brush"
  }
}
