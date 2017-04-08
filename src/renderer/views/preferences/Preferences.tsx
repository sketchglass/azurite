import {observer} from 'mobx-react'
import * as React from 'react'
import PreferencesViewModel from '../../viewmodels/PreferencesViewModel'
import DialogTitleBar from '../components/DialogTitleBar'
import './Preferences.css'

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
        <DialogTitleBar title="Preferences" />
        <div className="PreferencesTabBar">
          <div className="PreferencesTab PreferencesTab-selected">
            General
          </div>
        </div>
        <div className="PreferencesPane">
          <div className="PreferencesRow">
            <div>Undo Grouping Interval</div>
            <div>
              <input className="TextInput" type="number" value={undoGroupingInterval} onChange={onUndoGroupingIntervalChange} />
              <div>milliseconds</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
