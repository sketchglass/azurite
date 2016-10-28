import {observer} from "mobx-react"
import React = require("react")
import Navigation from "../models/Navigation"
import Picture from "../models/Picture"

interface NavigatorProps {
  picture: Picture|undefined
}

@observer export default
class Navigator extends React.Component<NavigatorProps, {}> {
  render() {
    const {picture} = this.props
    const onScaleChange = (ev: React.FormEvent) => {
      if (picture) {
        picture.navigation.scale = parseFloat((ev.target as HTMLInputElement).value) / 100
      }
    }
    const onRotationChange = (ev: React.FormEvent) => {
      if (picture) {
        picture.navigation.rotation = parseInt((ev.target as HTMLInputElement).value) / 180 * Math.PI
      }
    }
    const navigation = picture ? picture.navigation : {rotation: 0, scale: 1, horizontalFlip: false}
    const {rotation, scale, horizontalFlip} = navigation
    const rotationDeg = Math.round(rotation / Math.PI * 180)
    const onHorizontalFlipChange = (ev: React.FormEvent) => {
      if (picture) {
        picture.navigation.horizontalFlip = (ev.target as HTMLInputElement).checked
      }
    }

    return (
      <div className="Navigator">
        <div>
          Scale: <input type="number" max={1600} onChange={onScaleChange} value={String(Math.round(scale * 100))} />
        </div>
        <div>
          Rotation: <input type="number" min={-180} max={180} onChange={onRotationChange} value={String(rotationDeg)} />
        </div>
        <div>
          <label><input type="checkbox" checked={horizontalFlip} onChange={onHorizontalFlipChange} />Flip Horizontally</label>
        </div>
      </div>
    )
  }
}
