import {remote} from 'electron'
import * as fs from 'fs'
import * as path from 'path'
const deepAssign = require('deep-assign')
import {BrushPresetData} from '../brush/BrushPreset'
import {ToolConfigData} from '../tools/Tool'

interface RectData {
  x: number
  y: number
  width: number
  height: number
}

interface ColorData {
  h: number
  s: number
  v: number
}

export
interface ConfigValues {
  window: {
    fullscreen: boolean
    bounds?: RectData
    maximized: boolean
  }
  tools: {
    [name: string]: ToolConfigData
  }
  currentTool: string
  color: ColorData
  palette: (ColorData|undefined)[]
  files: string[]
  brushPresets: BrushPresetData[]
  currentBrushPreset: number
  // TODO: preferences
}

export default
class Config {
  private _values: ConfigValues = {
    window: {
      fullscreen: false,
      maximized: false,
    },
    tools: {
    },
    currentTool: '',
    color: {h: 0, s: 0, v: 0},
    palette: [],
    files: [],
    brushPresets: [],
    currentBrushPreset: 0,
  }
  path = path.join(remote.app.getPath('userData'), 'config.json')

  get values() {
    return this._values
  }

  set values(values: ConfigValues) {
    fs.writeFileSync(this.path, JSON.stringify(values, null, 2))
    this._values = values
  }

  constructor() {
    try {
      const data = fs.readFileSync(this.path, 'utf8')
      deepAssign(this.values, JSON.parse(data))
    } catch (e) {
    }
  }
}

export const config = new Config()
