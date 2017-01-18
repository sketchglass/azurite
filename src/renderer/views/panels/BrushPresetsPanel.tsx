import * as React from "react"
import {observer} from "mobx-react"
import {brushPresetManager} from "../../app/BrushPresetManager"
import {BrushPreset} from "../../brush/BrushPreset"

function BrushPresetItem(props: {preset: BrushPreset}) {
  const {title} = props.preset
  return (
    <div className="BrushPresetItem">
      {title}
    </div>
  )
}

@observer
export default class BrushPresetsPanel extends React.Component<{}, {}> {
  render() {
    const {presets} = brushPresetManager
    return (
      <div className="BrushPresetsPanel">{
        presets.map((preset, i) => <BrushPresetItem key={i} preset={preset} />)
      }</div>
    )
  }
}
