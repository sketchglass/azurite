import * as React from "react"
import {action} from "mobx"
import {observer} from "mobx-react"
import {appState} from "../state/AppState"
import {PictureState} from "../state/PictureState"
const classNames = require("classnames")
import PointerEvents from "./components/PointerEvents"
import CSSVariables from "./components/CSSVariables"

const TAB_WIDTH = 160

class PictureTab extends React.Component<{pictureState: PictureState, current: boolean, onClose: () => void}, {}> {
  private element: HTMLElement
  private dragged = false
  private originalX = 0
  private offset = 0

  private onClick = () => {
    appState.currentPictureIndex = appState.pictureStates.indexOf(this.props.pictureState)
  }

  private onCloseClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation()
    this.props.onClose()
  }
  private onPointerDown = action((e: PointerEvent) => {
    this.element.setPointerCapture(e.pointerId)
    this.originalX = Math.round(e.clientX)
    this.dragged = true
  })
  private onPointerMove = action((e: PointerEvent) => {
    if (!this.dragged) {
      return
    }
    const x = Math.round(e.clientX)
    const offset = this.offset = x - this.originalX
    if (TAB_WIDTH / 2 < offset) {
      this.moveForward()
    } else if (offset < -TAB_WIDTH / 2) {
      this.moveBackward()
    }
    this.forceUpdate()
  })
  private onPointerUp = (e: PointerEvent) => {
    this.dragged = false
    this.offset = 0
    this.forceUpdate()
  }

  private moveForward() {
    const {pictureState} = this.props
    const index = appState.pictureStates.indexOf(pictureState)
    const current = index == appState.currentPictureIndex
    if (0 <= index && index < appState.pictureStates.length - 1) {
      appState.pictureStates.splice(index, 1)
      appState.pictureStates.splice(index + 1, 0, pictureState)
      if (current) {
        ++appState.currentPictureIndex
      }
      this.originalX += TAB_WIDTH
      this.offset -= TAB_WIDTH
    }
  }

  private moveBackward() {
    const {pictureState} = this.props
    const index = appState.pictureStates.indexOf(pictureState)
    const current = index == appState.currentPictureIndex
    if (0 < index) {
      appState.pictureStates.splice(index, 1)
      appState.pictureStates.splice(index - 1, 0, pictureState)
      if (current) {
        --appState.currentPictureIndex
      }
      this.originalX -= TAB_WIDTH
      this.offset += TAB_WIDTH
    }
  }

  render() {
    const {pictureState, current} = this.props
    const {offset} = this
    return (
      <CSSVariables offset={offset + "px"} width={TAB_WIDTH + "px"}>
        <PointerEvents onPointerDown={this.onPointerDown} onPointerMove={this.onPointerMove} onPointerUp={this.onPointerUp}>
          <div className={classNames("PictureTab", {"PictureTab-current": current})} onClick={this.onClick} ref={e => this.element = e}>
            <span className="PictureTab_title">{pictureState.picture.fileName}</span>
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
          const onClose = () => appState.closePicture(i)
          const current = i == currentPictureIndex
          return <PictureTab key={p.picture.id} pictureState={p} current={current} onClose={onClose}/>
        })
      }
      <div className="PictureTabFill"></div>
    </div>
  )
})
