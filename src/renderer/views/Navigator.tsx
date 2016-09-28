import React = require("react")
import Navigation from "../models/Navigation"
import Picture from "../models/Picture"
import "../../styles/Navigator.sass"

interface NavigatorProps {
  picture: Picture
}

interface NavigatorState {
  navigation: Navigation
}

export default
class Navigator extends React.Component<NavigatorProps, NavigatorState> {
  constructor(props: NavigatorProps) {
    super(props)
    this.state = {
      navigation: props.picture.navigation
    }
    this.props.picture.changed.forEach(() => {
      this.setState({
        navigation: props.picture.navigation
      })
    })
  }

  render() {
    const {navigation} = this.state
    const {picture} = this.props
    const onScaleChange = (ev: React.FormEvent<HTMLInputElement>) => {
      const {rotation, translation} = navigation
      const scale = parseFloat((ev.target as HTMLInputElement).value) / 100
      picture.navigation = {translation, scale, rotation}
      picture.changed.next()
    }
    const onRotationChange = (ev: React.FormEvent<HTMLInputElement>) => {
      const {scale, translation} = navigation
      const rotation = parseInt((ev.target as HTMLInputElement).value) / 180 * Math.PI
      picture.navigation = {translation, scale, rotation}
      picture.changed.next()
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
