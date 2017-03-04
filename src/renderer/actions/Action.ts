import {appState} from "../app/AppState"

export
abstract class Action {
  abstract id: string
  abstract title: string
  abstract enabled: boolean
  abstract run(): void
}
export default Action

export
abstract class PictureAction extends Action {
  get picture() {
    return appState.currentPicture
  }
  get pictureState() {
    return appState.currentPictureState
  }
  get enabled() {
    return !!this.picture
  }
}
