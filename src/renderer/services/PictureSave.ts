import {remote} from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import {formatRegistry} from '../app/FormatRegistry'
import PictureFormatAzurite from '../formats/PictureFormatAzurite'
import Picture from '../models/Picture'

const {dialog} = remote

const appFormat = new PictureFormatAzurite()

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
        filters: [appFormat.electronFileFilter],
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
    const fileData = await appFormat.export(this.picture)
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
    const filters = [appFormat, ...formatRegistry.pictureFormats].map(f => f.electronFileFilter)
    const filePaths = await new Promise<string[]|undefined>((resolve, reject) => {
      dialog.showOpenDialog(remote.getCurrentWindow(), {
        title: 'Open',
        filters,
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
    const dotExt = path.extname(filePath)
    const name = path.basename(filePath, dotExt)
    const ext = dotExt.slice(1)

    if (appFormat.extensions.includes(ext)) {
      const picture = await appFormat.importPicture(fileData, name)
      picture.filePath = filePath
      return picture
    } else {
      const format = formatRegistry.pictureFormatForExtension(ext)
      if (!format) {
        throw new Error('cannot find format')
      }
      const picture = await format.importPicture(fileData, name)
      picture.edited = true
      return picture
    }
  }
}
