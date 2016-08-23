import {Vec4} from "./Geometry"

export function parseHexColor(color: string) {
  const r = parseInt(color.substr(1, 2), 16) / 255
  const g = parseInt(color.substr(3, 2), 16) / 255
  const b = parseInt(color.substr(5, 2), 16) / 255
  return new Vec4(r, g, b, 1)
}

export function toHexColor(color: Vec4) {
  const {r, g, b} = color
  return '#' + [r, g, b].map(c => {
    const str = Math.round(c * 255).toString(16)
    return str.length == 1 ? "0" + str : str
  }).join("")
}
