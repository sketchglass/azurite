import {Context} from "paintgl"
export const canvas = document.createElement("canvas")
export const context = new Context(canvas, {preserveDrawingBuffer: true})
