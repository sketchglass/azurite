import React = require("react")
import {HSVColor} from "../../../lib/Color"

interface PaletteProps {
  palette: HSVColor[]
  paletteIndex: number
  onChange: (event: React.MouseEvent<Element>, index: number) => void
}

export default
function Palette(props: PaletteProps) {
  const {palette, paletteIndex} = props

  const rowLength = 10
  const rows: HSVColor[][] = []
  for (let i = 0; i < palette.length; i += rowLength) {
    rows.push(palette.slice(i, i + rowLength))
  }

  const rowElems = rows.map((row, y) => {
    const buttons = row.map((color, x) => {
      const i = y * rowLength + x
      const style = {
        backgroundColor: color.toString(),
      }
      const onClick = (e: React.MouseEvent<Element>) => {
        props.onChange(e, i)
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
