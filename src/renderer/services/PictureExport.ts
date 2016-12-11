import {Vec2} from "paintvec"
import Picture from "../models/Picture"
import TextureToCanvas from "../models/TextureToCanvas"
import {remote} from "electron"
const {dialog} = remote
import * as fs from "fs"

async function blobToBuffer(blob: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener("loadend", (ev) => {
      if (ev["error"]) {
        reject(ev["error"])
      } else {
        resolve(new Buffer(reader.result))
      }
    })
    reader.readAsArrayBuffer(blob)
  })
}

export
type PictureExportFormat = "png"|"jpeg"|"bmp"

export
class PictureExport {
  textureToCanvas = new TextureToCanvas(this.picture.size)

  constructor(public picture: Picture) {
  }

  async showExportDialog(format: PictureExportFormat) {
    const filter = (() => {
      switch (format) {
        default:
        case "png":
          return { name: "PNG", extensions: ["png"] }
        case "jpeg":
          return { name: "JPEG", extensions: ["jpg"] }
        case "bmp":
          return { name: "BMP", extensions: ["bmp"] }
      }
    })()
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

  async export(fileName: string, format: PictureExportFormat) {
    this.textureToCanvas.loadTexture(this.picture.layerBlender.getBlendedTexture(), new Vec2(0))
    this.textureToCanvas.updateCanvas()
    const blob = await this.getBlob(`image/${format}`)
    if (!blob) {
      throw new Error("Failed to generate image data")
    }
    const buffer = await blobToBuffer(blob)
    fs.writeFileSync(fileName, buffer)
  }

  getBlob(mimeType: string) {
    return new Promise<Blob|null>((resolve) => {
      this.textureToCanvas.canvas.toBlob(resolve, mimeType)
    })
  }

  dispose() {
    this.textureToCanvas.dispose()
  }
}
