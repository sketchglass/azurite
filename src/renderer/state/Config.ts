import * as fs from "fs"
import * as path from "path"
import {remote} from "electron"

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
  path = path.join(remote.app.getPath("userData"), "config.json")

  constructor() {
    try {
      const data = fs.readFileSync(this.path, "utf8")
      Object.assign(this.values, JSON.parse(data))
    } catch (e) {
    }
  }

  save() {
    fs.writeFileSync(this.path, JSON.stringify(this.values, null, 2))
  }
}

export const config = new Config()
