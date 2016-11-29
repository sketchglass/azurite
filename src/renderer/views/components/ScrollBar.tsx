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
  value: number
  min: number
  max: number
  handleLength: number
  onChange: (value: number) => void
}

function ScrollBar(props: ScrollBarProps) {
  const {direction, value, min, max, handleLength, onChange} = props
  const length = max - min + handleLength
  const handleStart = value / length
  const handleEnd = (value + handleLength) / length
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
