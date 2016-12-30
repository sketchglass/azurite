import {remote} from "electron"
const {dialog} = remote
import Picture from "../models/Picture"
import ImageFormat from "../formats/ImageFormat"
import {PictureSave} from "../services/PictureSave"
import {PictureExport} from "../services/PictureExport"
import {dialogLauncher} from "../views/dialogs/DialogLauncher"
import {FlipPictureCommand, Rotate90PictureCommand, Rotate180PictureCommand, ChangePictureResolutionCommand} from "../commands/PictureCommand"
import {SelectAllCommand, ClearSelectionCommand, InvertSelectionCommand} from "../commands/SelectionCommand"
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

  async export(format: ImageFormat) {
    const pictureExport = new PictureExport(this.picture)
    await pictureExport.showExportDialog(format)
    pictureExport.dispose()
  }

  dispose() {
    this.thumbnailManager.dispose()
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

  static async openFromPath(filePath: string) {
    const picture = await PictureSave.openFromPath(filePath)
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
    if (newDimension) {
      this.picture.undoStack.redoAndPush(new ChangePictureResolutionCommand(this.picture, newDimension))
    }
  }

  selectAll() {
    this.picture.undoStack.redoAndPush(new SelectAllCommand(this.picture))
  }

  clearSelection() {
    this.picture.undoStack.redoAndPush(new ClearSelectionCommand(this.picture))
  }

  invertSelection() {
    this.picture.undoStack.redoAndPush(new InvertSelectionCommand(this.picture))
  }
}
