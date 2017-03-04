import * as React from "react"
import {observer} from "mobx-react"
import {brushPresetManager} from "../app/BrushPresetManager"

@observer
export default
class BrushSettings extends React.Component<{}, {}> {
  render() {
    const preset = brushPresetManager.currentPreset
    return (
      <div className="BrushSettings">
        {preset && preset.renderSettings()}
      </div>
    )
  }
}
