import * as React from "react"
import {action} from "mobx"
import {observer} from "mobx-react"
import {brushPresetManager} from "../../app/BrushPresetManager"
import {BrushPreset} from "../../brush/BrushPreset"
import * as classNames from "classnames"

const BrushPresetItem = observer((props: {preset: BrushPreset, index: number}) => {
  const {preset, index} = props
  const {title} = preset
  const selected = brushPresetManager.currentPresetIndex == index
  const className = classNames("BrushPresetItem", {"BrushPresetItem-selected": selected})
  const onClick = action(() => {
    brushPresetManager.currentPresetIndex = index
  })
  return (
    <div className={className} onClick={onClick}>
      {title}
    </div>
  )
})

@observer
export default class BrushPresetsPanel extends React.Component<{}, {}> {
  render() {
    const {presets} = brushPresetManager
    return (
      <div className="BrushPresetsPanel">{
        presets.map((preset, i) => <BrushPresetItem key={i} preset={preset} index={i} />)
      }</div>
    )
  }
}
