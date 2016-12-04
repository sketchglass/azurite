import {observable, computed, action, IObservableArray} from "mobx"

export
interface UndoCommand {
  undo(): void
  redo(): void
  title: string
}

export
class CompositeUndoCommand implements UndoCommand {
  constructor(public title: string, public commands: UndoCommand[]) {
  }
  undo() {
    for (const command of Array.from(this.commands).reverse()) {
      command.undo()
    }
  }
  redo() {
    for (const command of this.commands) {
      command.redo()
    }
  }
}

export
class UndoStack {
  readonly commands: IObservableArray<UndoCommand> = observable([])
  @observable doneCount = 0

  @computed get undoCommand() {
    if (this.isUndoable) {
      return this.commands[this.doneCount - 1]
    }
  }

  @computed get redoCommand() {
    if (this.isRedoable) {
      return this.commands[this.doneCount]
    }
  }

  @computed get isUndoable() {
    return 1 <= this.doneCount
  }
  @computed get isRedoable() {
    return this.doneCount < this.commands.length
  }

  @action undo() {
    const command = this.undoCommand
    if (command) {
      command.undo()
      this.doneCount -= 1
    }
  }
  @action redo() {
    const command = this.redoCommand
    if (command) {
      command.redo()
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
