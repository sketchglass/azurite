import {Context} from "paintgl"
export const canvas = document.createElement("canvas")
canvas.className = "DrawArea_canvas"
export const context = new Context(canvas, {preserveDrawingBuffer: true, alpha: false})
