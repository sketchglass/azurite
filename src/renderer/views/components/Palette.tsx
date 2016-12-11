import React = require("react")
import {observer} from "mobx-react"
import {HSVColor} from "../../../lib/Color"

interface PaletteProps {
  palette: HSVColor[]
  paletteIndex: number
  onChange: (event: React.MouseEvent<Element>, index: number) => void
}

const Palette = observer((props: PaletteProps) => {
  const {palette} = props

  const rowLength = 10
  const rows: HSVColor[][] = []
  for (let i = 0; i < palette.length; i += rowLength) {
    rows.push(palette.slice(i, i + rowLength))
  }

  const rowElems = rows.map((row, y) => {
    const buttons = row.map((color, x) => {
      const i = y * rowLength + x
      const onClick = (e: React.MouseEvent<Element>) => {
        props.onChange(e, i)
      }
      const colorElem = color.equals(HSVColor.transparent)
        ? <div className="Palette-color Palette-color-transparent" />
        : <div className="Palette-color" style={{backgroundColor: color.toString()}} />
      return <div className="Palette-button" key={x} onClick={onClick}>{colorElem}</div>
    })
    return <div className="Palette-row" key={y}>{buttons}</div>
  })

  return (
    <div className="Palette">
      {rowElems}
    </div>
  )
})
export default Palette
