import Point from "../../lib/Point"

export
function mouseOffsetPos(ev: {clientX: number, clientY: number}, element: Element) {
  const rect = element.getBoundingClientRect()
  return new Point(ev.clientX - rect.left, ev.clientY - rect.top)
}
