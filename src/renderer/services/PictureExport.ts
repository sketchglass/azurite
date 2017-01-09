import {Vec2} from "paintvec"
import Picture from "../models/Picture"
import {ImageLayer} from "../models/Layer"
import TextureToCanvas from "../models/TextureToCanvas"
import {remote} from "electron"
const {dialog} = remote
import * as fs from "fs"
import * as path from "path"
import ImageFormat from "../formats/ImageFormat"
import {UndoCommand, CompositeUndoCommand} from "../models/UndoStack"
import {AddLayerCommand} from "../commands/LayerCommand"
import {formatRegistry} from "../state/FormatRegistry"

export
type PictureExportFormat = "png"|"jpeg"|"bmp"

export
class PictureExport {
  private textureToCanvas = new TextureToCanvas(this.picture.size)

  constructor(public picture: Picture) {
  }

  async showExportDialog(format: ImageFormat) {
    const filter = {name: format.title, extensions: format.extensions}
    const fileName = await new Promise<string|undefined>((resolve, reject) => {
      dialog.showSaveDialog(remote.getCurrentWindow(), {
        title: "Export...",
        filters: [filter]
      }, resolve)
    })
    if (fileName) {
      await this.export(fileName, format)
    }
  }

  async showImportDialog() {
    const extensions = formatRegistry.imageExtensions()
    const fileNames = await new Promise<string[]>((resolve, reject) => {
      dialog.showOpenDialog(remote.getCurrentWindow(), {
        title: "Import...",
        filters: [{name: "Image", extensions}]
      }, resolve)
    })
    await this.import(fileNames)
  }

  async export(fileName: string, format: ImageFormat) {
    this.textureToCanvas.loadTexture(this.picture.blender.getBlendedTexture(), new Vec2(0))
    this.textureToCanvas.updateCanvas()
    const buffer = await format.export(this.textureToCanvas.canvas)
    fs.writeFileSync(fileName, buffer)
  }

  async import(fileNames: string[]) {
    if (fileNames.length == 0) {
      return
    }
    const indexPath = this.picture.insertPath
    const commands: UndoCommand[] = []

    for (const fileName of fileNames) {
      const ext = path.extname(fileName)
      const format = formatRegistry.imageFormatForExtension(ext.slice(1))
      if (format) {
        const buffer = fs.readFileSync(fileName)
        const canvas = await format.import(buffer)
        const layer = new ImageLayer(this.picture, {name: path.basename(fileName, ext)})
        layer.tiledTexture.putImage(new Vec2(), canvas)
        commands.push(new AddLayerCommand(this.picture, indexPath, layer))
      }
    }

    const compositeCommand = new CompositeUndoCommand("Import Images", commands)
    this.picture.undoStack.redoAndPush(compositeCommand)
  }

  dispose() {
    this.textureToCanvas.dispose()
  }
}
