import {observable, computed} from 'mobx'
import {isTextInput} from './util'

export default
class CurrentFocus {
  @observable element = document.activeElement

  @computed get isTextInput() {
    return isTextInput(this.element)
  }

  constructor() {
    window.addEventListener('focus', () => this.onFocusChange(), true)
    window.addEventListener('blur', () => this.onFocusChange(), true)
  }

  private onFocusChange() {
    this.element = document.activeElement
  }
}

export const currentFocus = new CurrentFocus()
