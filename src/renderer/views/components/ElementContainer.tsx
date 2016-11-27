import * as React from "react"

export default
class ElementContainer<TProps, TState> extends React.Component<TProps, TState> {
  element: HTMLElement|undefined

  render() {
    const elems: React.ReactElement<any>[] = []
    React.Children.forEach(this.props.children, child => {
      if (typeof child == "object" && typeof child.type == "string") {
        const origRef = child["ref"]
        elems.push(React.cloneElement(child, {
          ref: (elem: HTMLElement) => {
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
