import {observable} from "mobx"

export interface BrushPresetProps {
  title: string
  width: number
  opacity: number
  softness: number
  minWidthRatio: number
  stabilizingLevel: number
}

export interface BrushPresetData extends BrushPresetProps {
  engine: string
}

export abstract class BrushPreset implements BrushPresetProps {
  @observable title = "Brush"
  // brush width (diameter)
  @observable width = 10
  // brush opacity
  @observable opacity = 1
  // distance used to soften edge, compared to brush radius
  @observable softness = 0.5
  // width drawn in pressure 0, compared to brush width
  @observable minWidthRatio = 0.5
  // how many neighbor event positions used to stabilize stroke
  @observable stabilizingLevel = 2

  constructor(props: BrushPresetProps) {
    this.title = props.title
    this.width = props.width
    this.opacity = props.opacity
    this.softness = props.softness
    this.minWidthRatio = props.minWidthRatio
    this.stabilizingLevel = 2
  }

  abstract toData(): BrushPresetData
}
