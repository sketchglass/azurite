import {computed, observable, action} from "mobx"
import {remote} from "electron"
import {appState} from "./AppState"
import {isTextInput} from "../views/util"

export
class UndoState {
  constructor() {
    window.addEventListener("focus", e => {
      this.isTextInputFocused = isTextInput(document.activeElement)
    }, true)
  }

  @computed get undoStack() {
    const {modal, modalUndoStack, currentPictureState} = appState
    if (modal) {
      return modalUndoStack
    }
    if (currentPictureState) {
      return currentPictureState.picture.undoStack
    }
  }

  @observable isTextInputFocused = false

  @computed get canUndo() {
    if (this.isTextInputFocused) {
      return true
    } else if (this.undoStack) {
      return this.undoStack.isUndoable
    }
    return false
  }

  @computed get canRedo() {
    if (this.isTextInputFocused) {
      return true
    } else if (this.undoStack) {
      return this.undoStack.isRedoable
    }
    return false
  }

  @computed get undoName() {
    if (this.undoStack) {
      const {undoCommand} = this.undoStack
      if (undoCommand) {
        return undoCommand.title
      }
    }
    return ""
  }

  @computed get redoName() {
    if (this.undoStack) {
      const {redoCommand} = this.undoStack
      if (redoCommand) {
        return redoCommand.title
      }
    }
    return ""
  }

  @action undo() {
    if (this.isTextInputFocused) {
      remote.getCurrentWebContents().undo()
    } else if (this.undoStack) {
      this.undoStack.undo()
    }
  }

  @action redo() {
    if (this.isTextInputFocused) {
      remote.getCurrentWebContents().redo()
    } else if (this.undoStack) {
      this.undoStack.redo()
    }
  }
}

export const undoState = new UndoState()
