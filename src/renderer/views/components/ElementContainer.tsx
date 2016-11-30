import * as React from "react"

function hookRef<T>(elem: React.ReactElement<any>, ref: (elem: T) => void) {
  const origRef = elem["ref"]
  return React.cloneElement(elem, {
    ref: (elem: T) => {
      if (origRef) {
        origRef(elem)
      }
      ref(elem)
    }
  })
}

export default
class ElementContainer<TProps, TState> extends React.Component<TProps, TState> {
  element: HTMLElement|undefined

  render() {
    const child = React.Children.only(this.props.children)
    if (typeof child == "object") {
      if (typeof child.type == "function" && child.type.prototype instanceof ElementContainer) {
        return hookRef<ElementContainer<any, any>>(child, nested => {
          if (nested) {
            this.element = nested.element
          }
        })
      }
      if (typeof child.type == "string") {
        return hookRef<HTMLElement>(child, elem => {
          this.element = elem
        })
      }
    }
    throw new Error("child must be DOM element or nested ElementContainer")
  }
}
