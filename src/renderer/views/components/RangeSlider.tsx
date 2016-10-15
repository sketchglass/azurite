import React = require("react")
import "../../../styles/components/RangeSlider.sass"

export interface RangeSliderProps {
  min: number
  max: number
  value: number
  step?: number
  onChange: (value: number) => void
  disabled?: boolean
  backgroundComponent?: React.ComponentClass<any> | React.StatelessComponent<any>
  backgroundComponentProps?: any
}

export default class RangeSlider extends React.Component<RangeSliderProps, void> {
  clicking = false
  fillWidth = 0
  slider: HTMLDivElement
  constructor() {
    super()
  }
  componentDidMount() {
    const {value} = this.props
    this.update(value)
    this.slider.addEventListener("pointerup", this.onPointerUp)
    this.slider.addEventListener("pointerdown", this.onPointerDown)
    this.slider.addEventListener("pointermove", this.onPointerMove)
  }
  componentWillReceiveProps(props: RangeSliderProps) {
    const {value} = props
    this.update(value)
  }
  componentWillUnmount() {
    this.slider.removeEventListener("pointerup", this.onPointerUp)
    this.slider.removeEventListener("pointerdown", this.onPointerDown)
    this.slider.removeEventListener("pointermove", this.onPointerMove)
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
    const {min, max} = this.props
    this.fillWidth = (value - min) / (max - min) * 100
    this.forceUpdate()
  }
  render() {
    const {value, min, max, backgroundComponentProps} = this.props
    const BackgroundComponent = this.props.backgroundComponent
    const fillStyle = {
      width: `${this.fillWidth}%`
    }
    const className = this.props.disabled ? "RangeSlider RangeSlider-disabled" : "RangeSlider" // TODO: change behavior
    const background = BackgroundComponent ? <BackgroundComponent {...backgroundComponentProps} /> : null
    return (
      <div className={className} ref={s => { this.slider = s }}>
        <div className="RangeSlider_fill" style={fillStyle} />
        { background }
      </div>
    )
  }
}
