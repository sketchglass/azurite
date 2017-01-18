import * as React from "react"
import {observable} from "mobx"
import {BrushPreset, BrushPresetProps, BrushPresetData, BrushIconType} from "../BrushPreset"
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

  clone() {
    return new BrushPresetPen(this.engine, this.toProps())
  }

  toProps(): BrushPresetPenProps {
    const {eraser} = this
    return {...super.toProps(), eraser}
  }

  toData(): BrushPresetPenData {
    return {
      engine: "pen",
      ...this.toProps(),
    }
  }

  renderSettings() {
    return <PenSettings preset={this} />
  }

  get iconType(): BrushIconType {
    if (this.eraser) {
      return "eraser"
    } else {
      return "pen"
    }
  }
}
