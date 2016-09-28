import React = require("react")
import {Color} from "../../lib/Color"
import "../../styles/Palette.sass"

interface PaletteProps {
  palette: Color[]
  paletteIndex: number
  onChange: (index: number) => void
}

export default
function Palette(props: PaletteProps) {
  const {palette, paletteIndex} = props

  const rowLength = 5
  const rows: Color[][] = []
  for (let i = 0; i < palette.length; i += rowLength) {
    rows.push(palette.slice(i, i + rowLength))
  }

  const rowElems = rows.map((row, y) => {
    const buttons = row.map((color, x) => {
      const i = y * rowLength + x
      const selected = paletteIndex === i
      const style = {
        backgroundColor: color.toString(),
        border: selected ? "2px solid #444" : "2px solid #ddd"
      }
      const onClick = () => {
        props.onChange(i)
      }
      return <div className="Palette-button" style={style} key={x} onClick={onClick} />
    })
    return <div className="Palette-row" key={y}>{buttons}</div>
  })

  return (
    <div className="Palette">
      {rowElems}
    </div>
  )
}
