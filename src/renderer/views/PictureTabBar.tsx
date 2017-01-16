import * as React from "react"
import {observer} from "mobx-react"
import {appState} from "../state/AppState"
import Picture from "../models/Picture"
const classNames = require("classnames")
import PointerEvents from "./components/PointerEvents"

class PictureTab extends React.Component<{picture: Picture, current: boolean, onClick: () => void, onClose: () => void}, {}> {
  private onCloseClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation()
    this.props.onClose()
  }
  render() {
    const {picture, current, onClick} = this.props
    const {onCloseClick} = this
    return (
      <PointerEvents>
        <div className={classNames("PictureTab", {"PictureTab-current": current})} onClick={onClick}>
          <span className="PictureTab_title">{picture.fileName}</span>
          <span className="PictureTab_close" onClick={onCloseClick}>x</span>
        </div>
      </PointerEvents>
    )
  }
}

export
const PictureTabBar = observer((props: {hidden: boolean}) => {
  const {pictureStates, currentPictureIndex} = appState
  return (
    <div className="PictureTabBar" hidden={props.hidden}>
      {
        pictureStates.map((p, i) => {
          const onClick = () => appState.currentPictureIndex = i
          const onClose = () => appState.closePicture(i)
          const current = i == currentPictureIndex
          return <PictureTab key={i} picture={p.picture} current={current} onClick={onClick} onClose={onClose}/>
        })
      }
      <div className="PictureTabFill"></div>
    </div>
  )
})
