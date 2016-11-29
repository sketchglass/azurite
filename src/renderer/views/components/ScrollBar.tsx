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
  min: number
  max: number
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
  onPointerDown = (e: PointerEvent) => {
    this.handle.setPointerCapture(e.pointerId)
    this.origX = e.clientX
    this.origY = e.clientY
    this.moving = true
    this.props.onChangeBegin()
  }
  onPointerMove = (e: PointerEvent) => {
    if (this.moving) {
      const {max, min, direction, onChange} = this.props
      const rect = this.element.getBoundingClientRect()
      if (direction == ScrollBarDirection.Horizontal) {
        const offset = e.clientX - this.origX
        onChange(offset / rect.width * (max - min))
      } else {
        const offset = e.clientY - this.origY
        onChange(offset / rect.height * (max - min))
      }
    }
  }
  onPointerUp = (e: PointerEvent) => {
    this.moving = false
  }

  element: HTMLElement
  handle: HTMLElement

  render() {
    const {direction, min, max, visibleMin, visibleMax, onChange} = this.props
    const length = max - min
    const handleStart = (visibleMin - min) / length
    const handleEnd = (visibleMax - min) / length
    const className = classNames("ScrollBar", {
      "ScrollBar-vertical": direction == ScrollBarDirection.Vertical,
      "ScrollBar-horizontal": direction == ScrollBarDirection.Horizontal,
    })
    return (
      <CSSVariables handleStart={handleStart} handleEnd={handleEnd}>
        <div className={className} ref={e => this.element = e}>
          <PointerEvents onPointerDown={this.onPointerDown} onPointerMove={this.onPointerMove} onPointerUp={this.onPointerUp}>
            <div className="ScrollBar_handle" ref={e => this.handle = e} />
          </PointerEvents>
        </div>
      </CSSVariables>
    )
  }
}
