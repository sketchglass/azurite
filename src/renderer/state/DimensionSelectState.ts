import {observable, computed, action, reaction} from "mobx"
import {PictureDimension} from "../models/Picture"
import {MAX_PICTURE_SIZE} from "../../common/constants"

export
type DimensionUnit = "px" | "mm" | "inch"

export
interface DimensionPreset {
  name: string
  unit: DimensionUnit
  width: number
  height: number
  dpi: number
}

export default
class DimensionSelectState {
  readonly presets: DimensionPreset[] = [
    {
      name: "A4",
      unit: "mm",
      width: 210,
      height: 297,
      dpi: 144,
    },
    {
      name: "A5",
      unit: "mm",
      width: 148,
      height: 210,
      dpi: 144,
    },
    {
      name: "A6",
      unit: "mm",
      width: 105,
      height: 148,
      dpi: 144,
    },
    {
      name: "1200 x 800",
      unit: "px",
      width: 1200,
      height: 800,
      dpi: 144,
    }
  ]

  @observable width = 0
  @observable height = 0
  @observable dpi = 0
  @observable unit: DimensionUnit = "px"
  @observable ratio = 1
  @observable keepRatio = true
  @observable lastSelectedPreset = -1

  @computed get widthRounded() {
    return Math.round(this.width)
  }
  @computed get heightRounded() {
    return Math.round(this.height)
  }

  @computed get widthCurrentUnit() {
    return this.fromPx(this.width, this.unit)
  }
  @computed get heightCurrentUnit() {
    return this.fromPx(this.height, this.unit)
  }

  @computed get widthCurrentUnitRounded() {
    return Math.round(this.widthCurrentUnit)
  }
  @computed get heightCurrentUnitRounded() {
    return Math.round(this.heightCurrentUnit)
  }

  constructor() {
    this.setPreset(0)
    reaction(() => [this.width, this.height], () => {
      this.lastSelectedPreset = -1
    })
  }

  @action setPreset(index: number) {
    const {width, height, dpi, unit} = this.presets[index]
    const {keepRatio} = this
    this.dpi = dpi
    this.unit = unit
    this.keepRatio = false
    this.changeSizeCurrentUnit(width, height)
    this.keepRatio = keepRatio
    this.lastSelectedPreset = index
  }

  @computed get dimension(): PictureDimension {
    return {
      width: this.widthRounded,
      height: this.heightRounded,
      dpi: this.dpi,
    }
  }

  @computed get tooLarge() {
    const {widthRounded, heightRounded} = this
    return widthRounded > MAX_PICTURE_SIZE || heightRounded > MAX_PICTURE_SIZE
  }

  @computed get isValid() {
    const {widthRounded, heightRounded} = this
    return 0 < widthRounded && 0 < heightRounded && !this.tooLarge
  }

  private toPx(value: number, unit: DimensionUnit) {
    const {dpi} = this
    switch (unit) {
      case "px":
        return value
      case "mm":
        return value / 25.4 * dpi
      case "inch":
        return value * dpi
    }
  }

  private fromPx(px: number, unit: DimensionUnit) {
    const {dpi} = this
    switch (unit) {
      case "px":
        return px
      case "mm":
        return px / dpi * 25.4
      case "inch":
        return px / dpi
    }
  }

  @action changeSizeCurrentUnit(width: number|undefined, height: number|undefined) {
    let w = width != undefined ? this.toPx(width, this.unit) : undefined
    let h = height != undefined ? this.toPx(height, this.unit) : undefined
    if (w == undefined && h != undefined  && this.keepRatio) {
      w = h / this.ratio
    }
    if (w != undefined && h == undefined  && this.keepRatio) {
      h = w * this.ratio
    }
    if (w != undefined) {
      this.width = w
    }
    if (h != undefined) {
      this.height = h
    }
    if (!this.keepRatio) {
      this.ratio = this.height / this.width
    }
  }

  @action changeDpi(dpi: number) {
    const {widthCurrentUnit, heightCurrentUnit} = this
    this.dpi = dpi
    this.changeSizeCurrentUnit(widthCurrentUnit, heightCurrentUnit)
  }
}
