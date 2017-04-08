import {remote} from 'electron'
import Picture from '../models/Picture'
import TextureToCanvas from '../models/TextureToCanvas'
const {dialog} = remote
import * as fs from 'fs'
import * as path from 'path'
import {formatRegistry} from '../app/FormatRegistry'
import {AddLayerCommand} from '../commands/LayerCommand'
import PictureFormat from '../formats/PictureFormat'
import {UndoCommand, CompositeUndoCommand} from '../models/UndoStack'

export
type PictureExportFormat = 'png'|'jpeg'|'bmp'

export
class PictureExport {
  private textureToCanvas = new TextureToCanvas(this.picture.size)

  constructor(public picture: Picture) {
  }

  async showExportDialog(format: PictureFormat) {
    const filter = {name: format.title, extensions: format.extensions}
    const fileName = await new Promise<string|undefined>((resolve, reject) => {
      dialog.showSaveDialog(remote.getCurrentWindow(), {
        title: 'Export...',
        filters: [filter]
      }, resolve)
    })
    if (fileName) {
      await this.export(fileName, format)
    }
  }

  async showImportDialog() {
    const extensions = formatRegistry.pictureExtensions()
    const fileNames = await new Promise<string[]>((resolve, reject) => {
      dialog.showOpenDialog(remote.getCurrentWindow(), {
        title: 'Import...',
        filters: [{name: 'Image', extensions}]
      }, resolve)
    })
    await this.import(fileNames)
  }

  async export(fileName: string, format: PictureFormat) {
    const buffer = await format.export(this.picture)
    fs.writeFileSync(fileName, buffer)
  }

  async import(fileNames: string[]) {
    if (fileNames.length === 0) {
      return
    }
    const indexPath = this.picture.insertPath
    const commands: UndoCommand[] = []

    for (const fileName of fileNames) {
      const ext = path.extname(fileName)
      const format = formatRegistry.pictureFormatForExtension(ext.slice(1))
      if (format) {
        const buffer = fs.readFileSync(fileName)
        const name = path.basename(fileName, ext)
        const layer =  await format.importLayer(buffer, name, this.picture)
        commands.push(new AddLayerCommand(this.picture, indexPath, layer))
      }
    }

    const compositeCommand = new CompositeUndoCommand('Import Images', commands)
    this.picture.undoStack.push(compositeCommand)
  }

  dispose() {
    this.textureToCanvas.dispose()
  }
}
