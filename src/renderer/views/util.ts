import {Vec2} from "paintvec"

export
function mouseOffsetPos(ev: {clientX: number, clientY: number}, element: Element) {
  const rect = element.getBoundingClientRect()
  return new Vec2(ev.clientX - rect.left + element.scrollLeft, ev.clientY - rect.top + element.scrollTop)
}
