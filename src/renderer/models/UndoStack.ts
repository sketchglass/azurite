import {observable, computed, action, IObservableArray} from "mobx"

export
interface UndoCommand {
  undo(): void
  redo(): void
  title: string
}

export
class UndoStack {
  readonly commands: IObservableArray<UndoCommand> = observable([])
  @observable doneCount = 0

  @computed get isUndoable() {
    return 1 <= this.doneCount
  }
  @computed get isRedoable() {
    return this.doneCount < this.commands.length
  }

  @action undo() {
    if (this.isUndoable) {
      this.commands[this.doneCount - 1].undo()
      this.doneCount -= 1
    }
  }
  @action redo() {
    if (this.isRedoable) {
      this.commands[this.doneCount].redo()
      this.doneCount += 1
    }
  }
  @action push(command: UndoCommand) {
    this.commands.splice(this.doneCount)
    this.commands.push(command)
    this.doneCount += 1
  }
  @action redoAndPush(command: UndoCommand) {
    command.redo()
    this.push(command)
  }
}

export const undoStack = new UndoStack()
