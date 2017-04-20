import * as React from 'react'
import * as ReactDOM from 'react-dom'

interface PointerEventsProps {
  onPointerDown?: (ev: PointerEvent) => void
  onPointerMove?: (ev: PointerEvent) => void
  onPointerUp?: (ev: PointerEvent) => void
}

export default
class PointerEvents extends React.Component<PointerEventsProps, {}> {
  private element: HTMLElement|undefined

  componentDidMount() {
    this.element = ReactDOM.findDOMNode(this) as HTMLElement
    if (this.element) {
      this.element.addEventListener('pointerup', this.onPointerUp)
      this.element.addEventListener('pointerdown', this.onPointerDown)
      this.element.addEventListener('pointermove', this.onPointerMove)
    }
  }
  componentWillUnmount() {
    if (this.element) {
      this.element.removeEventListener('pointerup', this.onPointerUp)
      this.element.removeEventListener('pointerdown', this.onPointerDown)
      this.element.removeEventListener('pointermove', this.onPointerMove)
    }
  }
  render() {
    return React.Children.only(this.props.children)
  }
  private onPointerUp = (e: PointerEvent) => {
    if (this.props.onPointerUp) {
      this.props.onPointerUp(e)
    }
  }
  private onPointerMove = (e: PointerEvent) => {
    if (this.props.onPointerMove) {
      this.props.onPointerMove(e)
    }
  }
  private onPointerDown = (e: PointerEvent) => {
    if (this.props.onPointerDown) {
      this.props.onPointerDown(e)
    }
  }
}
