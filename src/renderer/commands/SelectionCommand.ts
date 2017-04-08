import {UndoCommand} from '../models/UndoStack'
import Picture from '../models/Picture'
import Selection from '../models/Selection'

abstract class SelectionCommand implements UndoCommand {
  abstract title: string
  oldSelection: Selection

  constructor(public picture: Picture) {
  }

  undo() {
    this.picture.selection = this.oldSelection
    this.picture.lastUpdate = {}
  }

  abstract newSelection(): Selection

  redo() {
    this.oldSelection = this.picture.selection
    this.picture.selection = this.newSelection()
    this.picture.lastUpdate = {}
  }
}

export
class SelectionChangeCommand extends SelectionCommand {
  title = 'Change Selection'

  constructor(public picture: Picture, public selection: Selection) {
    super(picture)
  }

  newSelection() {
    return this.selection.clone()
  }
}

export
class SelectAllCommand extends SelectionCommand {
  title = 'Select All'

  newSelection() {
    const selection = new Selection(this.picture.size)
    selection.selectAll()
    return selection
  }
}


export
class ClearSelectionCommand extends SelectionCommand {
  title = 'Clear Selection'

  newSelection() {
    return new Selection(this.picture.size)
  }
}

export
class InvertSelectionCommand extends SelectionCommand {
  title = 'Invert Selection'

  newSelection() {
    return this.picture.selection.invert()
  }
}
