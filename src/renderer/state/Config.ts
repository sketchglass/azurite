const ElectronConfig = require("electron-config")

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
interface ConfigData {
  window: {
    fullscreen: boolean
    bounds?: RectData
  }
  tools: {
    [name: string]: Object
  }
  palette: (ColorData|undefined)[]
  // TODO: open files
  // TODO: preferences
}

export default
class Config {
  values: ConfigData = {
    window: {
      fullscreen: false,
    },
    tools: {
    },
    palette: [],
  }
  config = new ElectronConfig()

  constructor() {
    Object.assign(this.values, this.config.store)
  }

  save() {
    this.config.store = this.values
  }
}

export const config = new Config()
