import * as React from 'react'
import {observable, action} from 'mobx'
import {observer} from 'mobx-react'
import {appState} from '../app/AppState'
import {PictureState} from '../app/PictureState'
const classNames = require('classnames')
import PointerEvents from './components/PointerEvents'
import CSSVariables from './components/CSSVariables'
import './PictureTabBar.css'

const TAB_WIDTH = 160

interface PictureTabProps {
  pictureState: PictureState
  current: boolean
  shift: number
  onClick: () => void
  onClose: () => void
  onMove: (indexOffset: number) => void
  onMoveEnd: () => void
}

@observer
class PictureTab extends React.Component<PictureTabProps, {}> {
  private element: HTMLElement
  @observable private dragged = false
  private originalX = 0
  @observable private offset = 0

  private onCloseClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation()
    this.props.onClose()
  }
  private onPointerDown = action((e: PointerEvent) => {
    this.element.setPointerCapture(e.pointerId)
    this.originalX = Math.round(e.clientX)
    this.dragged = true
    this.props.onClick()
  })
  private onPointerMove = action((e: PointerEvent) => {
    if (!this.dragged) {
      return
    }
    const x = Math.round(e.clientX)
    const offset = this.offset = x - this.originalX
    this.props.onMove(Math.round(offset / TAB_WIDTH))
  })
  private onPointerUp = action((e: PointerEvent) => {
    this.dragged = false
    this.offset = 0
    this.props.onMoveEnd()
  })

  render() {
    const {pictureState, current, shift} = this.props
    const className = classNames('PictureTab', {
      'PictureTab-current': current,
    })
    const offset = this.offset + shift * TAB_WIDTH
    return (
      <CSSVariables offset={offset + 'px'} width={TAB_WIDTH + 'px'}>
        <PointerEvents onPointerDown={this.onPointerDown} onPointerMove={this.onPointerMove} onPointerUp={this.onPointerUp}>
          <div className={className} ref={e => this.element = e}>
            <span className="PictureTab_title">{pictureState.picture.fileName}</span>
            <span className="PictureTab_close" onClick={this.onCloseClick}>x</span>
          </div>
        </PointerEvents>
      </CSSVariables>
    )
  }
}

@observer
export
class PictureTabBar extends React.Component<{hidden: boolean}, {}> {
  @observable private moving = false
  @observable private movingIndex = 0
  @observable private movingIndexOffset = 0
  private get movingIndexNew() {
    return this.movingIndex + this.movingIndexOffset
  }

  render() {
    const {pictureStates, currentPictureIndex} = appState
    return (
      <div className="PictureTabBar" hidden={this.props.hidden}>
        {
          pictureStates.map((p, i) => {
            const current = i === currentPictureIndex
            const shiftRight = this.moving && this.movingIndexNew <= i && i < this.movingIndex
            const shiftLeft = this.moving && this.movingIndex < i && i <= this.movingIndexNew
            const shift = shiftRight ? 1 : shiftLeft ? -1 : 0
            const onClick = () => appState.currentPictureIndex = i
            const onClose = () => appState.closePicture(i)
            const onMove = action((indexOffset: number) => {
              this.moving = true
              this.movingIndex = i
              this.movingIndexOffset = indexOffset
            })
            const onMoveEnd = action(() => {
              if (this.movingIndexOffset !== 0) {
                const newIndex = Math.max(0, Math.min(this.movingIndexNew, appState.pictureStates.length - 1))
                const [state] = appState.pictureStates.splice(this.movingIndex, 1)
                appState.pictureStates.splice(newIndex , 0, state)
                if (current) {
                  appState.currentPictureIndex = newIndex
                }
              }
              this.moving = false
              this.movingIndex = 0
              this.movingIndexOffset = 0
            })
            return <PictureTab key={p.picture.id} pictureState={p} shift={shift} current={current} onClose={onClose} onClick={onClick} onMove={onMove} onMoveEnd={onMoveEnd}/>
          })
        }
        <div className="PictureTabFill"></div>
      </div>
    )
  }
}
