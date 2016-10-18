import * as React from "react"
import {observer} from "mobx-react"
import {AppState} from "../models/AppState"
import Picture from "../models/Picture"
import "../../styles/PictureTabBar.sass"
const classNames = require("classnames")

const PictureTab = observer((props: {picture: Picture, current: boolean, onClick: () => void}) => {
  return (
    <div className={classNames("PictureTab", {"PictureTab-current": props.current})} onClick={props.onClick}>
      {props.picture.fileName}
    </div>
  )
})

export
const PictureTabBar = observer(() => {
  const appState = AppState.instance
  const {pictures, currentPictureIndex} = appState
  return (
    <div className="PictureTabBar">
      {
        pictures.map((p, i) => {
          const onClick = () => appState.currentPictureIndex = i
          const current = i == currentPictureIndex
          return <PictureTab key={i} picture={p} current={current} onClick={onClick}/>
        })
      }
    </div>
  )
})
