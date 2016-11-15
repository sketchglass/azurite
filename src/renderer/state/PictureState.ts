import {remote} from "electron"
const {dialog} = remote
import Picture from "../models/Picture"
import {PictureSave} from "../services/PictureSave"
import {PictureExport, PictureExportFormat} from "../services/PictureExport"
import {Dialog} from "../views/Dialog"
import PictureParams from "../models/PictureParams"

export
class PictureState {
  constructor(public readonly picture: Picture) {
  }

  async confirmClose() {
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
        const saved = await this.save()
        if (!saved) {
          return false
        }
      }
    }
    return true
  }

  save() {
    return new PictureSave(this.picture).save()
  }

  saveAs() {
    return new PictureSave(this.picture).saveAs()
  }

  async export(format: PictureExportFormat) {
    const pictureExport = new PictureExport(this.picture)
    await pictureExport.showExportDialog(format)
    pictureExport.dispose()
  }

  dispose() {
    this.picture.dispose()
  }

  static async new() {
    const dialog = new Dialog<PictureParams>("newPicture")
    const params = await dialog.open()
    if (params) {
      return new PictureState(new Picture(params))
    }
  }

  static async open() {
    const picture = await PictureSave.open()
    if (picture) {
      return new PictureState(picture)
    }
  }
}
