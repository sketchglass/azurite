import {computed, observable, action} from "mobx"
import * as React from "react"
import {observer} from "mobx-react"
import Picture from  "../models/Picture"
import Layer, {LayerBlendMode} from "../models/Layer"
import RangeSlider from "./components/RangeSlider"
import {ChangeLayerPropsCommand} from "../commands/LayerCommand"

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

interface LayerDetailProps {
  picture: Picture|undefined
  layer: Layer|undefined
}

@observer export default
class LayerDetail extends React.Component<LayerDetailProps, {}> {
  oldOpacity = 1

  onBlendModeChange = action((e: React.FormEvent<HTMLSelectElement>) => {
    const {picture, layer} = this.props
    if (picture && layer) {
      const blendMode = (e.target as HTMLSelectElement).value as LayerBlendMode
      picture.undoStack.redoAndPush(new ChangeLayerPropsCommand(picture, layer.path(), {blendMode}))
    }
  })
  onOpaictyChangeBegin = action(() => {
    const {layer} = this.props
    this.oldOpacity =  layer ? layer.opacity : 1
  })
  onOpacityChange = action((value: number) => {
    const {picture, layer} = this.props
    if (layer) {
      layer.opacity = value / 100
    }
  })
  onOpacityChangeEnd = action((value: number) => {
    const {picture, layer} = this.props
    if (picture && layer) {
      const opacity = value / 100
      layer.opacity = this.oldOpacity
      picture.undoStack.redoAndPush(new ChangeLayerPropsCommand(picture, layer.path(), {opacity}))
    }
  })

  render() {
    const {layer} = this.props
    const blendMode = layer ? layer.blendMode : "normal"
    const opacity = layer ? layer.opacity : 1

    return (
      <div className="LayerDetail">
        <div>
          <label>Blend</label>
          <select value={blendMode} onChange={this.onBlendModeChange}>
            {blendModes.map(mode => <option key={mode} value={mode}>{blendModeTexts.get(mode)}</option>)}
          </select>
        </div>
        <div>
          <label>Opacity</label>
          <RangeSlider onChangeBegin={this.onOpaictyChangeBegin} onChange={this.onOpacityChange} onChangeEnd={this.onOpacityChangeEnd} min={0} max={100} value={Math.round(opacity * 100)} />
          <span>{Math.round(opacity * 100)}%</span>
        </div>
      </div>
    )
  }
}
