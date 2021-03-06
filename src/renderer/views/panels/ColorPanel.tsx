import {action} from 'mobx'
import {observer} from 'mobx-react'
import * as React from 'react'
import {HSVColor} from '../../../lib/Color'
import {appState} from '../../app/AppState'
import ColorPicker from '../components/ColorPicker'
import Palette from '../components/Palette'
import RGBRangeSliders from '../components/RGBRangeSliders'
import './ColorPanel.css'

@observer
export default
class ColorPanel extends React.Component<{}, {}> {
  render() {
    const {color, paletteIndex, palette} = appState

    return (
      <div className='ColorPanel'>
        <ColorPicker color={color} onChange={this.onColorChange} />
        <RGBRangeSliders color={color} onChange={this.onColorChange} />
        <Palette palette={palette} paletteIndex={paletteIndex} onChange={this.onPaletteChange} />
      </div>
    )
  }

  private onPaletteChange = action((e: React.MouseEvent<Element>, index: number) => {
    appState.paletteIndex = index
    if (e.shiftKey) {
      appState.palette[index] = appState.color
    } else {
      const color = appState.palette[index]
      if (color) {
        appState.color = color
      }
    }
  })

  private onColorChange = action((value: HSVColor) => {
    appState.color = value
  })
}
