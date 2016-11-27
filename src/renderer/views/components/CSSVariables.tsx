import * as React from "react"
import ElementContainer from "./ElementContainer"

interface CSSVariablesProps {
  variables: {[key: string]: string|number}
}

export default
class CSSVariables extends ElementContainer<CSSVariablesProps, {}> {
  constructor() {
    super()
  }

  componentDidMount() {
    this.setProperties(this.props.variables)
  }
  componentWillReceiveProps(props: CSSVariablesProps) {
    this.setProperties(props.variables)
  }
  private setProperties(variables: {[key: string]: string|number}) {
    if (this.element) {
      for (const key in variables) {
        this.element.style.setProperty(key, String(variables[key]))
      }
    }
  }
}
