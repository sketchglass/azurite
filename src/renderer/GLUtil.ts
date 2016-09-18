import {Geometry, GeometryUsage} from "../lib/GL"
import {context} from "./GLContext"

export
const unitGeometry = new Geometry(context, new Float32Array([
  -1, -1, 0, 0,
  1, -1, 1, 0,
  -1, 1, 0, 1,
  1, 1, 1, 1
]), [
  {attribute: "aPosition", size: 2},
  {attribute: "aTexCoord", size: 2},
],  new Uint16Array([
  0, 1, 2,
  1, 2, 3
]), GeometryUsage.Static)
