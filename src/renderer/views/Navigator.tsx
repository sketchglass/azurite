import {observer} from "mobx-react"
import React = require("react")
import Navigation from "../models/Navigation"
import Picture from "../models/Picture"
import "../../styles/Navigator.sass"

interface NavigatorProps {
  picture: Picture
}

@observer export default
class Navigator extends React.Component<NavigatorProps, {}> {
  render() {
    const {picture} = this.props
    const {navigation} = picture
    const onScaleChange = (ev: React.FormEvent<HTMLInputElement>) => {
      navigation.scale = parseFloat((ev.target as HTMLInputElement).value) / 100
    }
    const onRotationChange = (ev: React.FormEvent<HTMLInputElement>) => {
      navigation.rotation = parseInt((ev.target as HTMLInputElement).value) / 180 * Math.PI
    }
    const {rotation, scale} = picture.navigation
    const rotationDeg = Math.round(rotation / Math.PI * 180)

    return (
      <div className="Navigator">
        <div>
          Scale: <input type="number" max={1600} onChange={onScaleChange} value={Math.round(scale * 100)} />
        </div>
        <div>
          Rotation: <input type="number" min={-180} max={180} onChange={onRotationChange} value={rotationDeg} />
        </div>
      </div>
    )
  }
}
