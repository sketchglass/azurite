import * as React from "react"

interface PointerEventsProps {
  onPointerDown?: (ev: PointerEvent) => void
  onPointerMove?: (ev: PointerEvent) => void
  onPointerUp?: (ev: PointerEvent) => void
}

export default
class PointerEvents extends React.Component<PointerEventsProps, {}> {
  element: Element|undefined

  componentDidMount() {
    if (this.element) {
      this.element.addEventListener("pointerup", this.onPointerUp)
      this.element.addEventListener("pointerdown", this.onPointerDown)
      this.element.addEventListener("pointermove", this.onPointerMove)
    }
  }
  componentWillUnmount() {
    if (this.element) {
      this.element.removeEventListener("pointerup", this.onPointerUp)
      this.element.removeEventListener("pointerdown", this.onPointerDown)
      this.element.removeEventListener("pointermove", this.onPointerMove)
    }
  }
  onPointerUp = (e: PointerEvent) => {
    if (this.props.onPointerUp) {
      this.props.onPointerUp(e)
    }
  }
  onPointerMove = (e: PointerEvent) => {
    if (this.props.onPointerMove) {
      this.props.onPointerMove(e)
    }
  }
  onPointerDown = (e: PointerEvent) => {
    if (this.props.onPointerDown) {
      this.props.onPointerDown(e)
    }
  }

  render() {
    let elem: React.ReactElement<any>|undefined
    React.Children.forEach(this.props.children, child => {
      if (typeof child == "object" && typeof child.type == "string") {
        const origRef = child["ref"]
        elem = React.cloneElement(child, {
          ref: (elem: Element) => {
            if (origRef) {
              origRef(elem)
            }
            this.element = elem
          }
        })
      }
    })
    if (elem) {
      return elem
    } else {
      console.warn("child must be DOM element")
      return <div />
    }
  }
}
