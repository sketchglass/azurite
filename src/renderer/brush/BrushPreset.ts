import {observable} from "mobx"
import KeyInput, {KeyInputData} from "../../lib/KeyInput"

export type BrushIconType = "paint-brush"|"pen"|"eraser"
export type BrushType = "normal"|"eraser"

export interface BrushPresetData {
  title: string
  type: BrushType
  width: number
  opacity: number
  blending: number
  softness: number
  minWidthRatio: number
  stabilizingLevel: number
  shortcut: KeyInputData|undefined
}

export class BrushPreset implements BrushPresetData {
  static nextInternalKey = 0
  readonly internalKey = BrushPreset.nextInternalKey++

  @observable title = "Brush"
  // brush type
  @observable type: BrushType = "normal"
  // brush width (diameter)
  @observable width = 10
  // brush opacity
  @observable opacity = 1
  // how much color is blended in each dab
  @observable blending = 0.5
  // distance used to soften edge, compared to brush radius
  @observable softness = 0.5
  // width drawn in pressure 0, compared to brush width
  @observable minWidthRatio = 0.5
  // how many neighbor event positions used to stabilize stroke
  @observable stabilizingLevel = 2

  @observable shortcut: KeyInput|undefined

  constructor(props: BrushPresetData) {
    this.title = props.title
    this.type = props.type
    this.width = props.width
    this.opacity = props.opacity
    this.blending = props.blending
    this.softness = props.softness
    this.minWidthRatio = props.minWidthRatio
    this.stabilizingLevel = props.stabilizingLevel
    this.shortcut = props.shortcut && KeyInput.fromData(props.shortcut)
  }

  toData(): BrushPresetData {
    const {title, type, width, opacity, blending, softness, minWidthRatio, stabilizingLevel, shortcut} = this
    return {title, type, width, opacity, blending, softness, minWidthRatio, stabilizingLevel, shortcut: shortcut && shortcut.toData()}
  }

  clone() {
    return new BrushPreset(this.toData())
  }

  get iconType(): BrushIconType {
    if (this.type == "eraser") {
      return "eraser"
    }
    if (this.blending == 0) {
      return "pen"
    } else {
      return "paint-brush"
    }
  }
}
