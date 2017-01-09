import {PictureAction} from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction} from "../state/ActionRegistry"
import {MergeLayerCommand} from "../commands/LayerCommand"
import {GroupLayer} from "../models/Layer"

@addAction
export class MergeLayerAction extends PictureAction {
  id = ActionIDs.layerMerge
  title = "Merge Layers"

  get enabled() {
    const {picture} = this
    if (picture) {
      const {selectedLayers} = picture
      if (selectedLayers.length > 1) {
        return true
      }
      if (selectedLayers.length == 1 && selectedLayers[0] instanceof GroupLayer) {
        return true
      }
    }
    return false
  }

  run() {
    const {picture} = this
    if (picture) {
      if (picture.selectedLayers.length > 0) {
        const paths = picture.selectedLayers.map(l => l.path)
        picture.undoStack.redoAndPush(new MergeLayerCommand(picture, paths))
      }
    }
  }
}
