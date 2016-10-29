import * as React from "react"
import {observer} from "mobx-react"
import Layer, {LayerBlendMode} from "../models/Layer"
import RangeSlider from "./components/RangeSlider"

const blendModes: LayerBlendMode[] = [
  "normal",
  "plus",
  "multiply"
]

const blendModeTexts = new Map<LayerBlendMode, string>([
  ["normal", "Normal"],
  ["plus", "Plus"],
  ["multiply", "Multiply"],
])

const LayerDetail = observer((props: {layer?: Layer}) => {
  const {layer} = props

  const onBlendModeChange = (e: React.FormEvent<HTMLSelectElement>) => {
    if (layer) {
      layer.blendMode = e.target.value as LayerBlendMode
    }
  }
  const onOpacityChange = (value: number) => {
    if (layer) {
      layer.opacity = value / 100
    }
  }

  const blendMode = layer ? layer.blendMode : "normal"
  const opacity = layer ? layer.opacity : 1

  return (
    <div className="LayerDetail">
      <div>
        <label>Blend</label>
        <select value={blendMode} onChange={onBlendModeChange}>
          {blendModes.map(mode => <option key={mode} value={mode}>{blendModeTexts.get(mode)}</option>)}
        </select>
      </div>
      <div>
        <label>Opacity</label>
        <RangeSlider onChange={onOpacityChange} min={0} max={100} value={Math.round(opacity * 100)} />
        <span>{Math.round(opacity * 100)}%</span>
      </div>
    </div>
  )
})

export default LayerDetail
