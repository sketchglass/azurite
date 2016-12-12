import * as React from "react"
import {action} from "mobx"
import {observer} from "mobx-react"
import {appState} from "../state/AppState"
import {HSVColor} from "../../lib/Color"
import ColorPicker from "./components/ColorPicker"
import RGBRangeSliders from "./components/RGBRangeSliders"
import Palette from "./components/Palette"

@observer
export default
class ColorArea extends React.Component<{}, {}> {
  render() {
    const {color, paletteIndex, palette} = appState

    return (
      <div className="ColorArea">
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
      appState.color = appState.palette[index]
    }
  })

  private onColorChange = action((value: HSVColor) => {
    appState.color = value
  })
}
