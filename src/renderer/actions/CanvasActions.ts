import {PictureAction} from './Action'
import ActionIDs from './ActionIDs'
import {addAction} from '../app/ActionRegistry'
import {dialogLauncher} from '../views/dialogs/DialogLauncher'
import {FlipPictureCommand, Rotate90PictureCommand, Rotate180PictureCommand, ChangePictureResolutionCommand} from '../commands/PictureCommand'

@addAction
export class CanvasChangeResolutionAction extends PictureAction {
  id = ActionIDs.canvasChangeResolution
  title = 'Change Canvas Resolution...'
  async run() {
    if (!this.picture) {
      return
    }
    const newDimension = await dialogLauncher.openResolutionChangeDialog(this.picture.dimension)
    if (newDimension) {
      this.picture.undoStack.push(new ChangePictureResolutionCommand(this.picture, newDimension))
    }
  }
}

@addAction
export class CanvasRotateLeftAction extends PictureAction {
  id = ActionIDs.canvasRotateLeft
  title = 'Rotate 90° Left'
  run() {
    this.picture && this.picture.undoStack.push(new Rotate90PictureCommand(this.picture, 'left'))
  }
}

@addAction
export class CanvasRotateRightAction extends PictureAction {
  id = ActionIDs.canvasRotateRight
  title = 'Rotate 90° Right'
  run() {
    this.picture && this.picture.undoStack.push(new Rotate90PictureCommand(this.picture, 'right'))
  }
}

@addAction
export class CanvasRotate180Action extends PictureAction {
  id = ActionIDs.canvasRotate180
  title = 'Rotate 180°'
  run() {
    this.picture && this.picture.undoStack.push(new Rotate180PictureCommand(this.picture))
  }
}

@addAction
export class CanvasFlipHorizontallyAction extends PictureAction {
  id = ActionIDs.canvasFlipHorizontally
  title = 'Flip Horizontally'
  run() {
    this.picture && this.picture.undoStack.push(new FlipPictureCommand(this.picture, 'horizontal'))
  }
}

@addAction
export class CanvasFlipVerticallyAction extends PictureAction {
  id = ActionIDs.canvasFlipVertically
  title = 'Flip Vertically'
  run() {
    this.picture && this.picture.undoStack.push(new FlipPictureCommand(this.picture, 'vertical'))
  }
}
