import {remote} from "electron"
const {dialog} = remote
import Picture from "../models/Picture"
import {ImageLayer} from "../models/Layer"
import {PictureSave} from "../services/PictureSave"
import {dialogLauncher} from "../views/dialogs/DialogLauncher"
import ThumbnailManager from "./ThumbnailManager"
const Semaphore = require("promise-semaphore")

export
class PictureState {
  thumbnailManager = new ThumbnailManager(this.picture)
  saveSemaphore = new Semaphore()

  constructor(public readonly picture: Picture) {
  }

  confirmClose(): Promise<boolean> {
    return this.saveSemaphore.add(async () => {
      if (this.picture.edited) {
        const resultIndex = dialog.showMessageBox(remote.getCurrentWindow(), {
          buttons: ["Save", "Cancel", "Don't Save"],
          defaultId: 0,
          message: `Do you want to save changes to ${this.picture.fileName}?`,
          detail: "Your changes will be lost without saving.",
          cancelId: 1,
        })
        if (resultIndex == 1) {
          return false
        }
        if (resultIndex == 0) {
          const saved = await new PictureSave(this.picture).save()
          if (!saved) {
            return false
          }
        }
      }
      return true
    })
  }

  save(): Promise<boolean> {
    return this.saveSemaphore.add(async () => {
      return await new PictureSave(this.picture).save()
    })
  }

  saveAs(): Promise<boolean> {
    return this.saveSemaphore.add(async () => {
      return await new PictureSave(this.picture).saveAs()
    })
  }

  dispose() {
    this.thumbnailManager.dispose()
    this.picture.dispose()
  }

  static async new() {
    const dimension = await dialogLauncher.openNewPictureDialog()
    if (dimension) {
      const picture = new Picture(dimension)
      const layer = new ImageLayer(picture, {name: "Layer"})
      picture.layers.replace([layer])
      picture.selectedLayers.replace([layer])

      return new PictureState(picture)
    }
  }
}
