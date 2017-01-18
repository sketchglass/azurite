import * as React from "react"
import {observable} from "mobx"
import {BrushPreset, BrushPresetProps, BrushPresetData} from "../BrushPreset"
import PenSettings from "./PenSettings"
import {BrushEnginePen} from "./BrushEnginePen"

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

  constructor(public engine: BrushEnginePen, props: BrushPresetPenProps) {
    super(engine, props)
    this.eraser = props.eraser
  }

  toData(): BrushPresetPenData {
    const {title, width, opacity, softness, minWidthRatio, stabilizingLevel, eraser} = this
    return {
      engine: "pen",
      title, width, opacity, softness, minWidthRatio, stabilizingLevel, eraser
    }
  }

  renderSettings() {
    return <PenSettings preset={this} />
  }
}
