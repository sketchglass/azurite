import {Vec2} from "paintvec"

export
function isTextInput(elem: Element) {
  if (elem instanceof HTMLTextAreaElement) {
    return true
  }
  if (elem instanceof HTMLInputElement) {
    const inputTypes = ['text', 'password', 'number', 'email', 'url', 'search', 'date', 'datetime', 'datetime-local', 'time', 'month', 'week']
    return inputTypes.indexOf(elem.type) >= 0
  }
  return false
}
