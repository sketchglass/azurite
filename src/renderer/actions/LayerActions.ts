import {PictureAction} from "./Action"
import ActionIDs from "./ActionIDs"
import {addAction} from "../app/ActionRegistry"
import {
  MergeLayerCommand,
  AddLayerCommand,
  GroupLayerCommand,
  RemoveLayerCommand,
  ClearLayerCommand,
  FillLayerCommand,
} from "../commands/LayerCommand"
import {ImageLayer, GroupLayer} from "../models/Layer"
import {appState} from "../app/AppState"

@addAction
export class AddLayerAction extends PictureAction {
  id = ActionIDs.layerAdd
  title = "Add Layer"

  run() {
    const {picture} = this
    if (picture) {
      picture.undoStack.push(new AddLayerCommand(picture, picture.insertPath, new ImageLayer(picture, {name: "Layer"})))
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
      picture.undoStack.push(new AddLayerCommand(picture, picture.insertPath, new GroupLayer(picture, {name: "Group"}, [])))
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
      picture.undoStack.push(new GroupLayerCommand(picture, picture.selectedPaths))
    }
  }
}

@addAction
export class RemoveLayerAction extends PictureAction {
  id = ActionIDs.layerRemove
  title = "Remove Layer"

  run() {
    const {picture} = this
    if (picture) {
      picture.undoStack.push(new RemoveLayerCommand(picture, picture.selectedPaths))
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
        picture.undoStack.push(new MergeLayerCommand(picture, paths))
      }
    }
  }
}

@addAction
export class ClearLayerAction extends PictureAction {
  id = ActionIDs.layerClear
  title = "Clear Layer"

  run() {
    const {picture} = this
    if (picture && picture.currentLayer) {
      picture.undoStack.push(new ClearLayerCommand(picture, picture.currentLayer.path))
    }
  }
}

@addAction
export class FillLayerAction extends PictureAction {
  id = ActionIDs.layerFill
  title = "Fill Layer"

  run() {
    const {picture} = this
    if (picture && picture.currentLayer) {
      picture.undoStack.push(new FillLayerCommand(picture, picture.currentLayer.path, appState.color.toRgb()))
    }
  }
}
