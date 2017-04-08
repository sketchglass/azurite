import {reaction, computed} from 'mobx'
import * as React from 'react'
import {frameDebounce} from '../../../lib/Debounce'

abstract class FrameDebounced<TProps, TState> extends React.Component<TProps, TState> {
  private updateDisposer: () => void

  componentDidMount() {
    this.updateDisposer = reaction(() => this.rendered, frameDebounce(() => this.forceUpdate()))
  }
  componentWillUnmount() {
    this.updateDisposer()
  }

  abstract renderDebounced(): JSX.Element

  @computed get rendered() {
    return this.renderDebounced()
  }

  render() {
    return this.rendered
  }
}
export default FrameDebounced
