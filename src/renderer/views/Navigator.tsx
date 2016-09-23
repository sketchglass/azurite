import React = require("react")
import Navigation from "../models/Navigation"

interface NavigatorProps {
  navigation: Navigation
  onNavigationChange: (navigation: Navigation) => void
}

export default
function Navigator(props: NavigatorProps) {
  const onScaleChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const {rotation, translation} = props.navigation
    const scale = parseFloat((ev.target as HTMLInputElement).value) / 100
    props.onNavigationChange({translation, scale, rotation})
  }
  const onRotationChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const {scale, translation} = props.navigation
    const rotation = parseInt((ev.target as HTMLInputElement).value) / 180 * Math.PI
    props.onNavigationChange({translation, scale, rotation})
  }
  const {rotation, scale} = props.navigation
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
