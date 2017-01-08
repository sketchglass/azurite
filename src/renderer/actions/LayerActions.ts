import {PictureAction} from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction} from "../state/ActionRegistry"
import {MergeLayerCommand} from "../commands/LayerCommand"

@addAction
export class MergeLayerAction extends PictureAction {
  id = ActionIDs.layerMerge
  title = "Merge Layers"
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
