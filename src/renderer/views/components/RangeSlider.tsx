import React = require("react")
import "../../../styles/components/RangeSlider.sass"

type RangeSliderProps = {
  min: number
  max: number
  value: number
  step?: number
  onChange: (value: number) => void
  disabled?: boolean
}

export default class RangeSlider extends React.Component<RangeSliderProps, void> {
  fillWidth = 0
  width: number
  slider: HTMLDivElement
  constructor() {
    super()
  }
  componentDidMount() {
    const {value} = this.props
    this.width = this.slider.clientWidth
    this.update(value)
  }
  componentWillReceiveProps(props: RangeSliderProps) {
    const {value} = props
    this.update(value)
  }
  update(value: number) {
    const {min, max} = this.props
    const width = this.width
    this.fillWidth = (value - min) / (max - min) * 100
    this.forceUpdate()
  }
  render() {
    const {value, min, max} = this.props
    const fillStyle = {
      width: `${this.fillWidth}%`
    }
    const onChange = (e: React.MouseEvent<Element>) => {
      const {min, max} = this.props
      const relativeX = e.pageX - this.slider.getBoundingClientRect().left
      const width = this.width
      const value = Math.max(Math.min(min + Math.floor((relativeX / width) * 100), max), min)
      this.props.onChange(value)
    }
    const className = this.props.disabled ? "RangeSlider RangeSlider-disabled" : "RangeSlider" // TODO: change behavior
    return (
      <div className={className} onClick={onChange} ref={s => { this.slider = s }}>
        <div className="RangeSlider_fill" style={fillStyle} />
      </div>
    )
  }
}
