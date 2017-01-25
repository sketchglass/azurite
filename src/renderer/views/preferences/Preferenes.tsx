import * as React from "react"
import {observer} from "mobx-react"
import PreferencesViewModel from "../../viewmodels/PreferencesViewModel"

@observer
export default
class Preferences extends React.Component<{}, {}> {
  viewModel = new PreferencesViewModel()

  render() {
    const {undoGroupingInterval} = this.viewModel

    const onUndoGroupingIntervalChange = (e: React.FormEvent<HTMLInputElement>) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      this.viewModel.undoGroupingInterval = value
      this.viewModel.notifyChange()
    }

    return (
      <div className="Preferences">
        <div className="PreferencesPane">
          <div>Undo Grouping Interval</div>
          <input className="TextInput" type="number" value={undoGroupingInterval} onChange={onUndoGroupingIntervalChange} />
          <div>milliseconds</div>
        </div>
      </div>
    )
  }
}
