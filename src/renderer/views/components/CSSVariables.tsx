import * as React from "react"
import ElementContainer from "./ElementContainer"
const decamelize = require('decamelize')

interface CSSVariablesProps {
  [key: string]: string|number
}

export default
class CSSVariables extends ElementContainer<CSSVariablesProps, {}> {
  private oldProps: CSSVariablesProps = {}

  constructor() {
    super()
  }

  componentDidMount() {
    this.setProperties(this.props)
  }
  componentWillReceiveProps(props: CSSVariablesProps) {
    this.setProperties(props)
  }
  private setProperties(props: {[key: string]: string|number}) {
    if (this.element) {
      for (const key in props) {
        if (["key", "ref", "children"].indexOf(key) < 0) {
          if (this.oldProps[key] != props[key]) {
            this.element.style.setProperty(`--${decamelize(key, '-')}`, `${props[key]}`)
          }
        }
      }
      this.oldProps = props
    }
  }
}
