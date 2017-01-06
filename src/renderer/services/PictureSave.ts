import {remote} from "electron"
import * as msgpack from "msgpack-lite"
import * as fs from "fs"
import Picture from "../models/Picture"

const {dialog} = remote

const fileFilter = {
  name: "Azurite Picture",
  extensions: ["azurite"]
}

export
class PictureSave {

  constructor(public picture: Picture) {
  }

  async save() {
    if (this.picture.filePath) {
      if (!this.picture.edited) {
        return true
      }
      await this.saveToPath(this.picture.filePath)
      return true
    } else {
      return await this.saveAs()
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
      await this.saveToPath(filePath)
      return true
    } else {
      return false
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
    return await this.openFromPath(filePath)
  }

  static async openFromPath(filePath: string) {
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
