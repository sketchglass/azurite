import React = require("react")
import {HSVColor, EmptyColor} from "../../../lib/Color"

interface PaletteProps {
  palette: HSVColor[]
  paletteIndex: number
  onChange: (event: React.MouseEvent<Element>, index: number) => void
}

const TransparentRect = (props: {size: number}) => {
  const style = {
    fill: "rgba(122, 122, 122, 1)",
    fillOpacity: 0.8
  }
  const {size} = props
  return (
    <svg width={`${size}`} height={`${size}`} viewBox={`0 0 ${size} ${size}`}>
      <rect x={size/2} y={0} width={size/2} height={size/2} style={style}>
      </rect>
      <rect x={0} y={size/2} width={size/2} height={size/2} style={style}>
      </rect>
    </svg>
  )
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
      const onClick = (e: React.MouseEvent<Element>) => {
        props.onChange(e, i)
      }
      if (color.equals(EmptyColor)) {
        return <div className="Palette-button Palette-button-transparent" key={x} onClick={onClick}><TransparentRect size={12} /></div>
      } else {
        const style = {
          backgroundColor: color.toString(),
        }
        return <div className="Palette-button" style={style} key={x} onClick={onClick} />
      }
    })
    return <div className="Palette-row" key={y}>{buttons}</div>
  })

  return (
    <div className="Palette">
      {rowElems}
    </div>
  )
}
