import {Rect} from 'paintvec'

export
enum PSDColorMode {
  Bitmap = 0,
  Grayscale = 1,
  Indexed = 2,
  RGB = 3,
  CMYK = 4,
  Multichannel = 7,
}

export enum PSDSectionType {
  Layer = 0,
  OpenFolder = 1,
  ClosedFolder = 2,
  BoundingSectionDivider = 3, // means end of folder
}

export type PSDBlendModeKey
  = 'pass' // path through
  | 'norm' // normal
  | 'diss' // dissolve
  | 'dark' // darken
  | 'mul ' // multiply
  | 'idiv' // color burn
  | 'lbrn' // linear burn
  | 'dkCl' // darker color
  | 'lite' // lighten
  | 'scrn' // screen
  | 'div ' // color dodge
  | 'lddg' // linear dodge
  | 'lgCl' // lighter color
  | 'over' // overlay
  | 'sLit' // soft light
  | 'hLit' // hard light
  | 'vLit' // vivid light
  | 'lLit' // linear light
  | 'pLit' // pin light
  | 'hMix' // hard mix
  | 'diff' // difference
  | 'smud' // exclusion
  | 'fsub' // subtract
  | 'fdiv' // divide
  | 'hue ' // hue
  | 'sat ' // saturation
  | 'colr' // color
  | 'lum ' // luminosity

export
interface PSDChannelInfo {
  id: number
  dataLength: number
}

export
interface PSDLayerRecord {
  name: string
  opacity: number
  clipping: boolean
  transparencyProtected: boolean
  visible: boolean
  rect: Rect
  blendMode: PSDBlendModeKey
  sectionType: PSDSectionType
  channelInfos: PSDChannelInfo[]
  channelDatas: Buffer[]
}

export
enum PSDCompression {
  Raw = 0,
  RLE = 1,
  ZipWithoutPrediction = 2,
  ZipWithPrediction = 3,
}
