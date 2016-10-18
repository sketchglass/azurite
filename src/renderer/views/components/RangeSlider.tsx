import React = require("react")

export interface BackgroundProps {
  onPointerUp: (e: PointerEvent) => void
  onPointerDown: (e: PointerEvent) => void
  onPointerMove: (e: PointerEvent) => void
  width: number
}

export interface RangeSliderProps {
  min: number
  max: number
  value: number
  step?: number
  onChange: (value: number) => void
  disabled?: boolean
  backgroundComponent?: React.ComponentClass<any & BackgroundProps> | React.StatelessComponent<any & BackgroundProps>
  backgroundComponentProps?: any
}

export default class RangeSlider extends React.Component<RangeSliderProps, void> {
  clicking = false
  fillWidth = 0
  handleLeft = 0
  backgroundWidth = 200
  backgroundHeight = 20
  slider: HTMLDivElement
  handle: HTMLDivElement
  constructor() {
    super()
  }
  componentDidMount() {
    const {value} = this.props
    this.slider.addEventListener("pointerup", this.onPointerUp)
    this.slider.addEventListener("pointerdown", this.onPointerDown)
    this.slider.addEventListener("pointermove", this.onPointerMove)
    this.handle.addEventListener("pointerup", this.onPointerUp)
    this.handle.addEventListener("pointerdown", this.onPointerDown)
    this.handle.addEventListener("pointermove", this.onPointerMove)
    this.update(value)
  }
  componentWillReceiveProps(props: RangeSliderProps) {
    const {value} = props
    this.update(value)
  }
  componentWillUnmount() {
    this.slider.removeEventListener("pointerup", this.onPointerUp)
    this.slider.removeEventListener("pointerdown", this.onPointerDown)
    this.slider.removeEventListener("pointermove", this.onPointerMove)
    this.handle.removeEventListener("pointerup", this.onPointerUp)
    this.handle.removeEventListener("pointerdown", this.onPointerDown)
    this.handle.removeEventListener("pointermove", this.onPointerMove)
  }
  onChange(e: PointerEvent) {
    const {min, max} = this.props
    const rect = this.slider.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const rate = Math.max(0, Math.min(offsetX / rect.width, 1))
    const value = Math.round(rate * (max - min) + min)
    this.props.onChange(value)
  }
  onPointerDown = (e: PointerEvent) => {
    e.preventDefault()
    this.clicking = true
    this.onChange(e)
    this.slider.setPointerCapture(e.pointerId)
  }
  onPointerUp = (e: PointerEvent) => {
    e.preventDefault()
    this.clicking = false
  }
  onPointerMove = (e: PointerEvent) => {
    e.preventDefault()
    if(this.clicking) {
      this.onChange(e)
    }
  }
  update(value: number) {
    requestAnimationFrame(() => {
      const {min, max} = this.props
      const percentage = this.fillWidth = (value - min) / (max - min) * 100
      this.handleLeft = this.slider.getBoundingClientRect().width * percentage / 100
      this.backgroundWidth = this.slider.getBoundingClientRect().width
      this.backgroundHeight = this.slider.getBoundingClientRect().height
      this.forceUpdate()
    })
  }
  render() {
    const {value, min, max, backgroundComponentProps} = this.props
    const BackgroundComponent = this.props.backgroundComponent
    const fillStyle = {
      width: `${this.fillWidth}%`
    }
    const handleStyle = {
      top: "0px",
      left: `${this.handleLeft - 4}px`,
    }
    const className = this.props.disabled ? "RangeSlider RangeSlider-disabled" : "RangeSlider" // TODO: change behavior
    const background = BackgroundComponent ?
      <BackgroundComponent onPointerUp={this.onPointerUp} onPointerMove={this.onPointerMove} onPointerDown={this.onPointerDown}
        width={this.backgroundWidth} height={this.backgroundHeight} {...backgroundComponentProps} /> : <div className="RangeSlider_fill" style={fillStyle} />
    return (
      <div className={className}>
        <div className="RangeSlider_border" ref={s => { this.slider = s }}>
          { background }
        </div>
        <div className="RangeSlider_handle" style={handleStyle} ref={h => { this.handle = h }}/>
      </div>
    )
  }
}
