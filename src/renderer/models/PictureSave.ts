import {remote} from "electron"
import * as msgpack from "msgpack-lite"
import * as fs from "fs"
import Picture from "./Picture"

const {dialog} = remote

const fileFilter = {
  name: "Azurite Picture",
  extensions: ["azurite"]
}

export default
class PictureSave {

  constructor(public picture: Picture) {
  }

  async save() {
    if (!this.picture.edited) {
      return
    }
    if (!this.picture.filePath) {
      await this.saveAs()
    } else {
      await this.saveAs()
    }
  }

  async saveAs() {
    const filePath = await new Promise<string|undefined>((resolve, reject) => {
      dialog.showSaveDialog(remote.getCurrentWindow(), {
        title: "Save As...",
        filters: [fileFilter],
      }, resolve)
    })
    if (filePath) {
      this.saveToPath(filePath)
    }
  }

  async saveToPath(filePath: string) {
    const fileData = msgpack.encode(this.picture.toData())
    await new Promise((resolve, reject) => {
      fs.writeFile(filePath, fileData, (err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
    this.picture.filePath = filePath
    this.picture.edited = false
  }

  static async open() {
    const filePaths = await new Promise<string[]>((resolve, reject) => {
      dialog.showOpenDialog(remote.getCurrentWindow(), {
        title: "Open",
        filters: [fileFilter],
      }, resolve)
    })
    if (filePaths.length == 0) {
      return
    }
    const filePath = filePaths[0]
    const fileData = await new Promise<Buffer>((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
    const picture = Picture.fromData(msgpack.decode(fileData))
    picture.filePath = filePath
    return picture
  }
}
