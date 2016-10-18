import * as React from "react"
import {observer} from "mobx-react"
import {AppState} from "../models/AppState"
import Picture from "../models/Picture"
import "../../styles/PictureTabBar.sass"

const PictureTab = observer((props: {picture: Picture}) => {
  return (
    <div className="PictureTab">
      {props.picture.fileName}
    </div>
  )
})

export
const PictureTabBar = observer(() => {
  const appState = AppState.instance
  const {pictures} = appState
  return (
    <div className="PictureTabBar">
      {pictures.map(p => <PictureTab picture={p} />)}
    </div>
  )
})
