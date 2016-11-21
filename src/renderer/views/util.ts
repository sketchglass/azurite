import {Vec2} from "paintvec"

export
function mouseOffsetPos(ev: {clientX: number, clientY: number}, element: Element) {
  const rect = element.getBoundingClientRect()
  return new Vec2(ev.clientX - rect.left + element.scrollLeft, ev.clientY - rect.top + element.scrollTop)
}

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

export
function dropXIndexAt(element: HTMLElement, clientX: number) {
  const children = Array.from(element.children)
  for (const [i, child] of children.entries()) {
    const rect = child.getBoundingClientRect()
    if (i == 0 && clientX < rect.left) {
      return 0
    }
    if (rect.left <= clientX && clientX <= rect.right) {
      if (clientX <= rect.left + rect.width / 2) {
        return i
      } else {
        return i + 1
      }
    }
  }
  return children.length
}

export
function dropYIndexAt(element: HTMLElement, clientY: number) {
  const children = Array.from(element.children)
  for (const [i, child] of children.entries()) {
    const rect = child.getBoundingClientRect()
    if (i == 0 && clientY < rect.top) {
      return 0
    }
    if (rect.top <= clientY && clientY <= rect.bottom) {
      if (clientY <= rect.left + rect.width / 2) {
        return i
      } else {
        return i + 1
      }
    }
  }
  return children.length
}
