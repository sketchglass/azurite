import {PictureAction} from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction} from "../state/ActionRegistry"

@addAction
export class CanvasChangeResolutionAction extends PictureAction {
  id = ActionIDs.canvasChangeResolution
  title = "Change Canvas Resolution..."
  run() {
    this.pictureState && this.pictureState.changeResolution()
  }
}

@addAction
export class CanvasRotateLeftAction extends PictureAction {
  id = ActionIDs.canvasRotateLeft
  title = "Rotate 90° Left"
  run() {
    this.pictureState && this.pictureState.rotate90("left")
  }
}

@addAction
export class CanvasRotateRightAction extends PictureAction {
  id = ActionIDs.canvasRotateRight
  title = "Rotate 90° Right"
  run() {
    this.pictureState && this.pictureState.rotate90("right")
  }
}

@addAction
export class CanvasRotate180Action extends PictureAction {
  id = ActionIDs.canvasRotate180
  title = "Rotate 180°"
  run() {
    this.pictureState && this.pictureState.rotate180()
  }
}

@addAction
export class CanvasFlipHorizontallyAction extends PictureAction {
  id = ActionIDs.canvasFlipHorizontally
  title = "Flip Horizontally"
  run() {
    this.pictureState && this.pictureState.flip("horizontal")
  }
}

@addAction
export class CanvasFlipVerticallyAction extends PictureAction {
  id = ActionIDs.canvasFlipVertically
  title = "Flip Vertically"
  run() {
    this.pictureState && this.pictureState.flip("vertical")
  }
}
