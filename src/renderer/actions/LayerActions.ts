import {PictureAction} from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction} from "../state/ActionRegistry"
import {MergeLayerCommand, AddLayerCommand, GroupLayerCommand, RemoveLayerCommand, ClearLayersCommand} from "../commands/LayerCommand"
import {ImageLayer, GroupLayer} from "../models/Layer"

@addAction
export class AddLayerAction extends PictureAction {
  id = ActionIDs.layerAdd
  title = "Add Layer"

  run() {
    const {picture} = this
    if (picture) {
      const path = picture.insertPath
      picture.undoStack.redoAndPush(new AddLayerCommand(picture, path, new ImageLayer(picture, {name: "Layer"})))
    }
  }
}

@addAction
export class AddGroupAction extends PictureAction {
  id = ActionIDs.layerAddGroup
  title = "Add Group"

  run() {
    const {picture} = this
    if (picture) {
      const path = picture.insertPath
      picture.undoStack.redoAndPush(new AddLayerCommand(picture, path, new GroupLayer(picture, {name: "Group"}, [])))
    }
  }
}

@addAction
export class GroupLayerAction extends PictureAction {
  id = ActionIDs.layerGroup
  title = "Group Layers"

  run() {
    const {picture} = this
    if (picture) {
      if (picture.selectedLayers.length > 0) {
        const paths = picture.selectedLayers.map(l => l.path)
        picture.undoStack.redoAndPush(new GroupLayerCommand(picture, paths))
      }
    }
  }
}

@addAction
export class RemoveLayerAction extends PictureAction {
  id = ActionIDs.layerRemove
  title = "Remove Layer"

  get enabled() {
    return this.picture ? this.picture.selectedLayers.length > 0 : false
  }

  run() {
    const {picture} = this
    if (picture) {
      const paths = picture.selectedLayers.map(l => l.path)
      picture.undoStack.redoAndPush(new RemoveLayerCommand(picture, paths))
    }
  }
}

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

@addAction
export class ClearLayerAction extends PictureAction {
  id = ActionIDs.layerClear
  title = "Clear Layer"

  get enabled() {
    return this.picture ? this.picture.selectedLayers.length > 0 : false
  }

  run() {
    const {picture} = this
    if (picture) {
      const paths = picture.selectedLayers.map(l => l.path)
      picture.undoStack.redoAndPush(new ClearLayersCommand(picture, paths))
    }
  }
}
