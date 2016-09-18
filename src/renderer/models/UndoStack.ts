import {Subject} from "@reactivex/rxjs/dist/cjs/Subject"

export
interface UndoCommand {
  undo(): void
  redo(): void
}

export
class UndoStack {
  commands: UndoCommand[] = []
  doneCount = 0
  changed = new Subject<void>()

  get isUndoable() {
    return 1 <= this.doneCount
  }
  get isRedoable() {
    return this.doneCount < this.commands.length
  }

  undo() {
    if (this.isUndoable) {
      this.commands[this.doneCount - 1].undo()
      this.doneCount -= 1
      this.changed.next()
    }
  }
  redo() {
    if (this.isRedoable) {
      this.commands[this.doneCount].redo()
      this.doneCount += 1
      this.changed.next()
    }
  }
  push(command: UndoCommand) {
    this.commands.splice(this.doneCount)
    this.commands.push(command)
    this.doneCount += 1
    this.changed.next()
  }
}

export const undoStack = new UndoStack()
