import * as React from "react"
import {observer} from "mobx-react"
import {appState} from "../state/AppState"
import Picture from "../models/Picture"
const classNames = require("classnames")
import PointerEvents from "./components/PointerEvents"
import CSSVariables from "./components/CSSVariables"

class PictureTab extends React.Component<{picture: Picture, current: boolean, onClick: () => void, onClose: () => void}, {offset: number}> {
  state = {offset: 0}
  private element: HTMLElement
  private dragged = false
  private originalX = 0

  private onCloseClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation()
    this.props.onClose()
  }
  private onPointerDown = (e: PointerEvent) => {
    e.preventDefault()
    this.element.setPointerCapture(e.pointerId)
    this.originalX = Math.round(e.clientX)
    this.dragged = true
  }
  private onPointerMove = (e: PointerEvent) => {
    e.preventDefault()
    if (!this.dragged) {
      return
    }
    const x = Math.round(e.clientX)
    const offset = x - this.originalX
    this.setState({offset})
  }
  private onPointerUp = (e: PointerEvent) => {
    e.preventDefault()
    this.dragged = false
    this.setState({offset: 0})
  }

  render() {
    const {picture, current, onClick} = this.props
    const {offset} = this.state
    console.log(offset)
    return (
      <CSSVariables offset={offset + "px"}>
        <PointerEvents onPointerDown={this.onPointerDown} onPointerMove={this.onPointerMove} onPointerUp={this.onPointerUp}>
          <div className={classNames("PictureTab", {"PictureTab-current": current})} onClick={onClick} ref={e => this.element = e}>
            <span className="PictureTab_title">{picture.fileName}</span>
            <span className="PictureTab_close" onClick={this.onCloseClick}>x</span>
          </div>
        </PointerEvents>
      </CSSVariables>
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
