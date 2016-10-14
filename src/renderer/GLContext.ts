import {Context} from "paintgl"
export const canvas = document.createElement("canvas")
canvas.className = "DrawArea_GLCanvas"
export const context = new Context(canvas, {preserveDrawingBuffer: true})
