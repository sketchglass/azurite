import {remote} from "electron"
const {dialog} = remote
import Picture from "../models/Picture"
import {PictureSave} from "../services/PictureSave"
import {PictureExport, PictureExportFormat} from "../services/PictureExport"
import {dialogLauncher} from "../views/dialogs/DialogLauncher"
import {FlipPictureCommand, Rotate90PictureCommand, Rotate180PictureCommand} from "../commands/PictureCommand"

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
    const dimension = await dialogLauncher.openNewPictureDialog()
    if (dimension) {
      return new PictureState(new Picture(dimension))
    }
  }

  static async open() {
    const picture = await PictureSave.open()
    if (picture) {
      return new PictureState(picture)
    }
  }

  flip(orientation: "horizontal"|"vertical") {
    this.picture.undoStack.redoAndPush(new FlipPictureCommand(this.picture, orientation))
  }

  rotate90(direction: "left"|"right") {
    this.picture.undoStack.redoAndPush(new Rotate90PictureCommand(this.picture, direction))
  }

  rotate180() {
    this.picture.undoStack.redoAndPush(new Rotate180PictureCommand(this.picture))
  }

  async changeResolution() {
    const newDimension = await dialogLauncher.openResolutionChangeDialog(this.picture.dimension)
  }
}
