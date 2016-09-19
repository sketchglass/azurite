import Picture from "./Picture"
import TextureToCanvas from "./TextureToCanvas"
import {remote} from "electron"
const {dialog} = remote
import * as path from "path"
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

export default
class PictureExport {
  textureToCanvas = new TextureToCanvas(this.picture.size)

  constructor(public picture: Picture) {
  }

  async showExportDialog() {
    const fileName = await new Promise<string|undefined>((resolve, reject) => {
      dialog.showSaveDialog({
        title: "Export...",
        filters: [
          { name: "PNG", extensions: ["png"] },
        ]
      }, resolve)
    })
    if (fileName) {
      await this.export(fileName)
    }
  }

  async export(fileName: string) {
    this.textureToCanvas.loadTexture(this.picture.layerBlender.blendedTexture)
    const blob = await this.getBlob("image/png")
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
