import * as React from "react"
import {observer} from "mobx-react"
import PreferencesViewModel from "../../viewmodels/PreferencesViewModel"

@observer
export default
class Preferences extends React.Component<{}, {}> {
  viewModel = new PreferencesViewModel()
}
