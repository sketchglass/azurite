import {Vec2} from "../../lib/Geometry"

export
function mouseOffsetPos(ev: {clientX: number, clientY: number}, element: Element) {
  const rect = element.getBoundingClientRect()
  return new Vec2(ev.clientX - rect.left, ev.clientY - rect.top)
}
