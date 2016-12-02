import {observable, computed, action} from "mobx"
import {PictureDimension} from "../models/Picture"
import {MAX_PICTURE_SIZE} from "../../common/constants"

export
type DimensionUnit = "px" | "mm"

interface DimensionPresetPx {
  name: string
  unit: "px"
  widthPx: number
  heightPx: number
  dpi: number
}

interface DimensionPresetMm {
  name: string
  unit: "mm"
  widthMm: number
  heightMm: number
  dpi: number
}

export
type DimensionPreset = DimensionPresetPx | DimensionPresetMm

export
const dimensionPresets: DimensionPreset[] = [
  {
    name: "A4",
    unit: "mm",
    widthMm: 210,
    heightMm: 297,
    dpi: 144,
  },
  {
    name: "A5",
    unit: "mm",
    widthMm: 148,
    heightMm: 210,
    dpi: 144,
  },
  {
    name: "A6",
    unit: "mm",
    widthMm: 105,
    heightMm: 148,
    dpi: 144,
  },
  {
    name: "1200 x 800",
    unit: "px",
    widthPx: 1200,
    heightPx: 800,
    dpi: 144,
  }
]

function mmToPx(mm: number, dpi: number) {
  return Math.round(mm / 25.4 * dpi)
}

function pxToMm(px: number, dpi: number) {
  return Math.round(px / dpi * 25.4)
}

export default
class DimensionSelectState {
  @observable widthMm = 0
  @observable heightMm = 0
  @observable widthPx = 0
  @observable heightPx = 0
  @observable dpi = 0
  @observable unit: DimensionUnit = "px"
  @observable ratio = 1
  @observable keepRatio = true

  constructor() {
    this.setPreset(dimensionPresets[0])
  }

  @action setPreset(preset: DimensionPreset) {
    if (preset.unit == "px") {
      const {widthPx, heightPx, dpi, unit} = preset
      this.setPx(widthPx, heightPx, dpi, unit, this.keepRatio)
    } else {
      const {widthMm, heightMm, dpi, unit} = preset
      this.setMm(widthMm, heightMm, dpi, unit, this.keepRatio)
    }
  }

  @computed get dimension(): PictureDimension {
    return {
      width: this.widthPx,
      height: this.heightPx,
      dpi: this.dpi,
    }
  }

  @computed get tooLarge() {
    const {widthPx, heightPx} = this
    return widthPx > MAX_PICTURE_SIZE || heightPx > MAX_PICTURE_SIZE
  }

  @computed get isValid() {
    const {widthPx, heightPx} = this
    return 0 < widthPx && 0 < heightPx && !this.tooLarge
  }

  @computed get currentPresetIndex() {
    const {widthPx, heightPx, widthMm, heightMm, dpi} = this
    for (const [i, preset] of dimensionPresets.entries()) {
      if (preset.unit == "px") {
        if (preset.widthPx == widthPx && preset.heightPx == heightPx && preset.dpi == dpi) {
          return i
        }
      } else {
        if (preset.widthMm == widthMm && preset.heightMm == heightMm && preset.dpi == dpi) {
          return i
        }
      }
    }
    return -1
  }

  private setMm(widthMm: number, heightMm: number, dpi: number, unit: DimensionUnit, keepRatio: boolean) {
    const widthPx = mmToPx(widthMm, dpi)
    const heightPx = mmToPx(heightMm, dpi)
    const ratio = keepRatio ? this.ratio : heightMm / widthMm
    this.widthPx = widthPx
    this.heightPx = heightPx
    this.widthMm = widthMm
    this.heightMm = heightMm
    this.dpi = dpi
    this.unit = unit
    this.keepRatio = keepRatio
  }

  private setPx(widthPx: number, heightPx: number, dpi: number, unit: DimensionUnit, keepRatio: boolean) {
    const widthMm = pxToMm(widthPx, dpi)
    const heightMm = pxToMm(heightPx, dpi)
    const ratio = keepRatio ? this.ratio : heightPx / widthPx
    this.widthPx = widthPx
    this.heightPx = heightPx
    this.widthMm = widthMm
    this.heightMm = heightMm
    this.dpi = dpi
    this.unit = unit
    this.keepRatio = keepRatio
  }

  @action changeUnit(unit: DimensionUnit) {
    this.unit = unit
  }

  @action changeWidth(width: number) {
    const {dpi, unit, keepRatio} = this
    if (unit == "mm") {
      const height = keepRatio ? Math.round(width * this.ratio) : this.heightMm
      this.setMm(width, height, dpi, unit, keepRatio)
    } else {
      const height = keepRatio ? Math.round(width * this.ratio) : this.heightPx
      this.setPx(width, height, dpi, unit, keepRatio)
    }
  }

  @action changeHeight(height: number) {
    const {dpi, unit, keepRatio} = this
    if (unit == "mm") {
      const width = keepRatio ? Math.round(height / this.ratio) : this.widthMm
      this.setMm(width, height, dpi, unit, keepRatio)
    } else {
      const width = keepRatio ? Math.round(height / this.ratio) : this.widthPx
      this.setPx(width, height, dpi, unit, keepRatio)
    }
  }

  @action changeDpi(dpi: number) {
    const {unit, keepRatio} = this
    if (unit == "mm") {
      const {widthMm, heightMm} = this
      this.setMm(widthMm, heightMm, dpi, unit, keepRatio)
    } else {
      const {widthPx, heightPx} = this
      this.setPx(widthPx, heightPx, dpi, unit, keepRatio)
    }
  }

  @action changeKeepRatio(keepRatio: boolean) {
    this.keepRatio = keepRatio
    if (keepRatio) {
      this.ratio = this.heightMm / this.widthMm
    }
  }
}