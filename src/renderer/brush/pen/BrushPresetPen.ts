import {observable} from "mobx"
import {BrushPreset, BrushPresetProps, BrushPresetData} from "../BrushPreset"

export interface BrushPresetPenProps extends BrushPresetProps {
  eraser: boolean
}
export interface BrushPresetPenData extends BrushPresetPenProps, BrushPresetData {
  engine: "pen"
}
export function isPresetDataPen(data: BrushPresetData): data is BrushPresetPenData {
  return data.engine == "pen"
}

export class BrushPresetPen extends BrushPreset implements BrushPresetPenProps {
  @observable eraser = false

  constructor(props: BrushPresetPenProps) {
    super(props)
    this.eraser = props.eraser
  }

  toData(): BrushPresetPenData {
    const {width, opacity, softness, minWidthRatio, stabilizingLevel, eraser} = this
    return {
      engine: "pen",
      width, opacity, softness, minWidthRatio, stabilizingLevel, eraser
    }
  }
}
