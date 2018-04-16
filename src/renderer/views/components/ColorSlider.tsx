import {Color} from 'paintgl'
import * as React from 'react'
import {toHexColor} from '../../../lib/Color'
import './ColorSlider.css'
import CSSVariables from './CSSVariables'
import PointerEvents from './PointerEvents'

interface ColorSliderProps {
  color: Color
  value: number // [0, 1]
  onChange: (value: number) => void
  gradientSteps: [Color, number][]
}

function clamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max)
}

export default
class ColorSlider extends React.Component<ColorSliderProps, {}> {
  private element: HTMLElement
  private dragged = false

  private onMove(e: PointerEvent) {
    const {clientWidth} = this.element
    const newValue = clamp(e.offsetX / clientWidth, 0, 1)
    this.props.onChange(newValue)
  }
  private onPointerDown = (e: PointerEvent) => {
    this.dragged = true
    this.onMove(e)
    this.element.setPointerCapture(e.pointerId)
  }
  private onPointerMove = (e: PointerEvent) => {
    if (this.dragged) {
      this.onMove(e)
    }
  }
  private onPointerUp = (e: PointerEvent) => {
    this.dragged = false
  }
  render() {
    const {color, value} = this.props
    const gradientSteps = this.props.gradientSteps.map(([color, pos]) => `${toHexColor(color)} ${pos * 100}%`)
    const gradient = `linear-gradient(to right, ${gradientSteps.join(', ')})`
    return (
      <PointerEvents onPointerDown={this.onPointerDown} onPointerMove={this.onPointerMove} onPointerUp={this.onPointerUp}>
        <CSSVariables value={value} color={toHexColor(color)} gradient={gradient}>
          <div className="ColorSlider" ref={e => this.element = e!}>
            <div className="ColorSlider_gradient" />
            <div className="ColorSlider_handle" />
          </div>
        </CSSVariables>
      </PointerEvents>
    )
  }

}
