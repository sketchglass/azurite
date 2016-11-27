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
    const elems: React.ReactElement<any>[] = []
    React.Children.forEach(this.props.children, child => {
      if (typeof child == "object" && typeof child.type == "string") {
        const origRef = child["ref"]
        elems.push(React.cloneElement(child, {
          ref: (elem: Element) => {
            if (origRef) {
              origRef(elem)
            }
            this.element = elem
          }
        }))
      }
    })
    if (elems.length == 1) {
      return elems[0]
    } else {
      console.warn("children must be one DOM element")
      return <div />
    }
  }
}
