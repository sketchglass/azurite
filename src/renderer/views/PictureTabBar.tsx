import * as React from "react"
import {observer} from "mobx-react"
import {AppState} from "../models/AppState"
import Picture from "../models/Picture"
import "../../styles/PictureTabBar.sass"
const classNames = require("classnames")

const PictureTab = observer((props: {picture: Picture, current: boolean, onClick: () => void, onClose: () => void}) => {
  return (
    <div className={classNames("PictureTab", {"PictureTab-current": props.current})} onClick={props.onClick}>
      <span className="PictureTab_title">{props.picture.fileName}</span>
      <span className="PictureTab_close" onClick={props.onClose}>x</span>
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
          const onClose = () => {
            const [picture] = appState.pictures.splice(i, 1)
            picture.dispose()
            if (appState.pictures.length <= appState.currentPictureIndex) {
              appState.currentPictureIndex = appState.pictures.length - 1
            }
          }
          const current = i == currentPictureIndex
          return <PictureTab key={i} picture={p} current={current} onClick={onClick} onClose={onClose}/>
        })
      }
    </div>
  )
})
