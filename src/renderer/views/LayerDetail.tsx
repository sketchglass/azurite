import {action} from 'mobx'
import {observer} from 'mobx-react'
import * as React from 'react'
import {ChangeLayerPropsCommand} from '../commands/LayerCommand'
import Layer, {LayerBlendMode} from '../models/Layer'
import RangeSlider from './components/RangeSlider'

const blendModes: LayerBlendMode[] = [
  'normal',
  'plus',
  'multiply'
]

const blendModeTexts = new Map<LayerBlendMode, string>([
  ['normal', 'Normal'],
  ['plus', 'Plus'],
  ['multiply', 'Multiply'],
])

interface LayerDetailProps {
  layer: Layer|undefined
}

@observer export default
class LayerDetail extends React.Component<LayerDetailProps, {}> {
  oldOpacity = 1

  onBlendModeChange = action((e: React.FormEvent<HTMLSelectElement>) => {
    const {layer} = this.props
    if (layer) {
      const {picture} = layer
      const blendMode = (e.target as HTMLSelectElement).value as LayerBlendMode
      picture.undoStack.push(new ChangeLayerPropsCommand(picture, layer.path, 'Change Layer Blend Mode', {blendMode}))
    }
  })
  onOpaictyChangeBegin = action(() => {
    const {layer} = this.props
    this.oldOpacity =  layer ? layer.opacity : 1
  })
  onOpacityChange = action((value: number) => {
    const {layer} = this.props
    if (layer) {
      layer.opacity = value / 100
    }
  })
  onOpacityChangeEnd = action((value: number) => {
    const {layer} = this.props
    if (layer) {
      const {picture} = layer
      const opacity = value / 100
      layer.opacity = this.oldOpacity
      picture.undoStack.push(new ChangeLayerPropsCommand(picture, layer.path, 'Change Layer Opacity', {opacity}))
    }
  })
  onPreserveOpacityChange = action((e: React.FormEvent<HTMLInputElement>) => {
    const {layer} = this.props
    if (layer) {
      const {picture} = layer
      const preserveOpacity = (e.target as HTMLInputElement).checked
      picture.undoStack.push(new ChangeLayerPropsCommand(picture, layer.path, 'Change Layer Preserve Opacity', {preserveOpacity}))
    }
  })
  onClippingGroupChange = action((e: React.FormEvent<HTMLInputElement>) => {
    const {layer} = this.props
    if (layer) {
      const {picture} = layer
      const clippingGroup = (e.target as HTMLInputElement).checked
      picture.undoStack.push(new ChangeLayerPropsCommand(picture, layer.path, 'Change Layer Clipping Group', {clippingGroup}))
    }
  })

  render() {
    const {layer} = this.props
    const blendMode = layer ? layer.blendMode : 'normal'
    const opacity = layer ? layer.opacity : 1
    const preserveOpacity = layer ? layer.preserveOpacity : false
    const clippingGroup = layer ? layer.clippingGroup : false

    return (
      <div className="LayerDetail">
        <div>
          <label>Blend</label>
          <select className="Select" value={blendMode} onChange={this.onBlendModeChange}>
            {blendModes.map(mode => <option key={mode} value={mode}>{blendModeTexts.get(mode)}</option>)}
          </select>
        </div>
        <div>
          <label>Opacity</label>
          <RangeSlider onChangeBegin={this.onOpaictyChangeBegin} onChange={this.onOpacityChange} onChangeEnd={this.onOpacityChangeEnd} min={0} max={100} value={Math.round(opacity * 100)} postfix="%" />
        </div>
        <div>
          <label></label>
          <label>
            <input type="checkbox" onChange={this.onPreserveOpacityChange} checked={preserveOpacity} />
            Preserve Opacity
          </label>
        </div>
        <div>
          <label></label>
          <label>
            <input type="checkbox" onChange={this.onClippingGroupChange} checked={clippingGroup} />
            Clipping Group
          </label>
        </div>
      </div>
    )
  }
}
