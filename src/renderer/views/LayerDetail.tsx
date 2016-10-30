import {observable} from "mobx"
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

interface LayerDetailProps {
  layer: Layer|undefined
}

@observer export default
class LayerDetail extends React.Component<LayerDetailProps, {}> {
  @observable opacity = this.props.layer ? this.props.layer.opacity : 1

  componentWillReceiveProps(props: LayerDetailProps) {
    const {layer} = props
    this.opacity = layer ? layer.opacity : 0
  }

  onBlendModeChange = (e: React.FormEvent<HTMLSelectElement>) => {
    const {layer} = this.props
    if (layer) {
      layer.blendMode = e.target.value as LayerBlendMode
    }
  }
  onOpacityChange = (value: number) => {
    this.opacity = value / 100
  }
  onOpacityChangeDone = (value: number) => {
    const {layer} = this.props
    if (layer) {
      layer.opacity = value / 100
    }
  }

  render() {
    const {layer} = this.props
    const blendMode = layer ? layer.blendMode : "normal"
    const {opacity} = this

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
          <RangeSlider onChange={this.onOpacityChange} onFinish={this.onOpacityChangeDone} min={0} max={100} value={Math.round(opacity * 100)} />
          <span>{Math.round(opacity * 100)}%</span>
        </div>
      </div>
    )
  }
}
