import * as React from "react"
import CSSVariables from "./CSSVariables"
import PointerEvents from "./PointerEvents"
import * as classNames from "classnames"

export
enum ScrollBarDirection {
  Vertical,
  Horizontal,
}

interface ScrollBarProps {
  direction: ScrollBarDirection
  contentMin: number
  contentMax: number
  visibleMin: number
  visibleMax: number
  onChangeBegin: () => void
  onChange: (offset: number) => void
}

export default
class ScrollBar extends React.Component<ScrollBarProps, {}> {
  origX = 0
  origY = 0
  moving = false
  onHandlePointerDown = (e: PointerEvent) => {
    this.handle.setPointerCapture(e.pointerId)
    this.origX = e.clientX
    this.origY = e.clientY
    this.moving = true
    this.props.onChangeBegin()
  }
  onHandlePointerMove = (e: PointerEvent) => {
    if (this.moving) {
      const {contentMax, contentMin, direction, onChange} = this.props
      const rect = this.element.getBoundingClientRect()
      if (direction == ScrollBarDirection.Horizontal) {
        const offset = e.clientX - this.origX
        onChange(offset / rect.width * (contentMax - contentMin))
      } else {
        const offset = e.clientY - this.origY
        onChange(offset / rect.height * (contentMax - contentMin))
      }
    }
  }
  onHandlePointerUp = (e: PointerEvent) => {
    this.moving = false
  }

  onClick = (e: React.MouseEvent<HTMLElement>) => {
    const {visibleMax, visibleMin, direction, contentMax, contentMin, onChange, onChangeBegin} = this.props
    const current = (visibleMax + visibleMin) / 2
    const rect = this.element.getBoundingClientRect()
    let newValue: number
    if (direction == ScrollBarDirection.Horizontal) {
      newValue = (e.clientX - rect.left) / rect.width * (contentMax - contentMin) + contentMin
    } else {
      newValue = (e.clientY - rect.top) / rect.height * (contentMax - contentMin) + contentMin
    }
    onChangeBegin()
    onChange(newValue - current)
  }

  onHandleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
  }

  element: HTMLElement
  handle: HTMLElement

  render() {
    const {direction, contentMin, contentMax, visibleMin, visibleMax} = this.props
    const length = contentMax - contentMin
    const handleStart = (visibleMin - contentMin) / length
    const handleEnd = (visibleMax - contentMin) / length
    const className = classNames("ScrollBar", {
      "ScrollBar-vertical": direction == ScrollBarDirection.Vertical,
      "ScrollBar-horizontal": direction == ScrollBarDirection.Horizontal,
    })
    return (
      <CSSVariables handleStart={handleStart} handleEnd={handleEnd}>
        <div className={className} ref={e => this.element = e} onClick={this.onClick}>
          <PointerEvents onPointerDown={this.onHandlePointerDown} onPointerMove={this.onHandlePointerMove} onPointerUp={this.onHandlePointerUp}>
            <div className="ScrollBar_handle" ref={e => this.handle = e} onClick={this.onHandleClick} />
          </PointerEvents>
        </div>
      </CSSVariables>
    )
  }
}
