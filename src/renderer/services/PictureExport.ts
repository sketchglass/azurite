import {Vec2} from "paintvec"
import Picture from "../models/Picture"
import TextureToCanvas from "../models/TextureToCanvas"
import {remote} from "electron"
const {dialog} = remote
import * as fs from "fs"
import ImageFormat from "../formats/ImageFormat"

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
      dialog.showSaveDialog({
        title: "Export...",
        filters: [filter]
      }, resolve)
    })
    if (fileName) {
      await this.export(fileName, format)
    }
  }

  async export(fileName: string, format: ImageFormat) {
    this.textureToCanvas.loadTexture(this.picture.layerBlender.getBlendedTexture(), new Vec2(0))
    this.textureToCanvas.updateCanvas()
    const {context} = this.textureToCanvas
    const image = context.getImageData(0, 0, context.canvas.width, context.canvas.height)
    const buffer = await format.export(image)
    fs.writeFileSync(fileName, buffer)
  }

  dispose() {
    this.textureToCanvas.dispose()
  }
}
