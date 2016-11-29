import * as React from "react"
import CSSVariables from "./CSSVariables"
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
  onChange: (value: number) => void
}

function ScrollBar(props: ScrollBarProps) {
  const {direction, min, max, visibleMin, visibleMax, onChange} = props
  const length = max - min
  const handleStart = (visibleMin - min) / length
  const handleEnd = (visibleMax - min) / length
  const className = classNames("ScrollBar", {
    "ScrollBar-vertical": direction == ScrollBarDirection.Vertical,
    "ScrollBar-horizontal": direction == ScrollBarDirection.Horizontal,
  })
  return (
    <CSSVariables handleStart={handleStart} handleEnd={handleEnd}>
      <div className={className}>
        <div className="ScrollBar_handle" />
      </div>
    </CSSVariables>
  )
}

export default ScrollBar
