import {remote} from 'electron'
import * as fs from 'fs'
import Picture from '../models/Picture'
import PictureFormatAzurite from '../formats/PictureFormatAzurite'

const {dialog} = remote

const pictureFormat = new PictureFormatAzurite()
const fileFilter = {
  name: pictureFormat.title,
  extensions: pictureFormat.extensions,
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
        title: 'Save As...',
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
    const fileData = await pictureFormat.export(this.picture)
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

  static async getOpenPath() {
    const filePaths = await new Promise<string[]|undefined>((resolve, reject) => {
      dialog.showOpenDialog(remote.getCurrentWindow(), {
        title: 'Open',
        filters: [fileFilter],
      }, resolve)
    })
    if (filePaths && filePaths.length > 0) {
      return filePaths[0]
    }
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
    const picture = await pictureFormat.importPicture(fileData, '')
    picture.filePath = filePath
    return picture
  }
}
