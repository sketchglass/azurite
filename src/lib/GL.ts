import {Vec2, Vec4, Transform} from "./Geometry"

export
class Context {
  gl: WebGLRenderingContext
  halfFloatExt: any
  vertexArrayExt: any
  drawBuffersExt: any
  textureUnits = new TextureUnits(this)

  constructor(public element: HTMLCanvasElement) {
    const glOpts = {
      preserveDrawingBuffer: false,
      alpha: false,
      depth: false,
      stencil: false,
      antialias: true,
      premultipliedAlpha: true,
    };
    const gl = this.gl = element.getContext("webgl", glOpts)! as WebGLRenderingContext
    this.halfFloatExt = gl.getExtension("OES_texture_half_float")
    gl.getExtension("OES_texture_half_float_linear")
    this.vertexArrayExt = gl.getExtension("OES_vertex_array_object")
    this.drawBuffersExt = gl.getExtension("WEBGL_draw_buffers")

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    this.resize()
  }

  resize() {
    const {gl, element} = this
    gl.viewport(0, 0, element.width, element.height)
  }

  setClearColor(color: Vec4) {
    const {gl} = this
    gl.clearColor(color.r, color.g, color.b, color.a)
  }

  clear() {
    const {gl} = this
    gl.clear(gl.COLOR_BUFFER_BIT)
  }
}

export
class Texture {
  texture: WebGLTexture

  constructor(public context: Context, public size: Vec2) {
    const {gl, halfFloatExt} = context
    this.texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.width, size.height, 0, gl.RGBA, halfFloatExt.HALF_FLOAT_OES, null as any)
  }
}

export
class TextureUnits {
  constructor(public context: Context) {
  }

  set(i: number, texture: Texture) {
    const {gl} = this.context
    gl.activeTexture(gl.TEXTURE0 + i)
    gl.bindTexture(gl.TEXTURE_2D, texture.texture)
  }

  delete(i: number) {
    const {gl} = this.context
    gl.activeTexture(gl.TEXTURE0 + i)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }
}

export
const enum GeometryUsage {
  Static, Stream, Dynamic
}

export
class Geometry {
  buffer: WebGLBuffer
  vertexArray: any
  constructor(public context: Context, public data: Float32Array, public attributes: {attribute: string, size: number}[], public usage: GeometryUsage) {
    const {gl, vertexArrayExt} = context
    this.buffer = gl.createBuffer()!
    this.updateBuffer()
  }
  updateBuffer() {
    const {gl} = this.context
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.data, this.glUsage())
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
  }
  glUsage() {
    const {gl} = this.context
    switch (this.usage) {
      case GeometryUsage.Static:
        return gl.STATIC_DRAW
      case GeometryUsage.Stream:
        return gl.STREAM_DRAW
      case GeometryUsage.Dynamic:
      default:
        return gl.DYNAMIC_DRAW
    }
  }
}

export
class Shader {
  program: WebGLProgram

  constructor(public context: Context, public vertexShader: string, public fragmentShader: string) {
    const {gl} = context
    this.program = gl.createProgram()!
    this._addShader(gl.VERTEX_SHADER, this.vertexShader)
    this._addShader(gl.FRAGMENT_SHADER, this.fragmentShader)
    gl.linkProgram(this.program)
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error(`Failed to link shader:\n${gl.getProgramInfoLog(this.program)}`)
    }
  }

  private _addShader(type: number, source: string) {
    const {gl} = this.context
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`Failed to compile shader:\n${gl.getShaderInfoLog(shader)}`)
    }
    gl.attachShader(this.program, shader)
  }

  setUniformInt(name: string, value: number) {
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform1i(gl.getUniformLocation(this.program, name)!, value)
  }

  setUniformFloat(name: string, value: number) {
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform1f(gl.getUniformLocation(this.program, name)!, value)
  }

  setUniformVec2(name: string, value: Vec2) {
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform2fv(gl.getUniformLocation(this.program, name)!, value.toGLData())
  }

  setUniformVec4(name: string, value: Vec4) {
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniform4fv(gl.getUniformLocation(this.program, name)!, value.toGLData())
  }

  setUniformTransform(name: string, value: Transform) {
    const {gl} = this.context
    gl.useProgram(this.program)
    gl.uniformMatrix3fv(gl.getUniformLocation(this.program, name)!, false, value.toGLData())
  }
}

export
class Model {
  vertexArray: any
  stride = this.geometry.attributes.reduce((sum, {size}) => sum + size, 0)
  constructor(public context: Context, public geometry: Geometry, public shader: Shader) {
    const {gl, vertexArrayExt} = context
    this.vertexArray = vertexArrayExt.createVertexArrayOES()
    vertexArrayExt.bindVertexArrayOES(this.vertexArray)
    gl.useProgram(shader.program)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.geometry.buffer)
    let offset = 0
    for (const {attribute, size} of this.geometry.attributes) {
      const pos = gl.getAttribLocation(shader.program, attribute)!
      gl.enableVertexAttribArray(pos)
      gl.vertexAttribPointer(pos, size, gl.FLOAT, false, this.stride * 4, offset * 4)
      offset += size
    }
    vertexArrayExt.bindVertexArrayOES(null)
  }

  render() {
    const {gl, vertexArrayExt} = this.context
    gl.useProgram(this.shader.program)
    vertexArrayExt.bindVertexArrayOES(this.vertexArray)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.geometry.data.length / this.stride)
    vertexArrayExt.bindVertexArrayOES(null)
  }

  renderPoints() {
    const {gl, vertexArrayExt} = this.context
    gl.useProgram(this.shader.program)
    vertexArrayExt.bindVertexArrayOES(this.vertexArray)
    gl.drawArrays(gl.POINTS, 0, this.geometry.data.length / this.stride)
    vertexArrayExt.bindVertexArrayOES(null)
  }
}

export
class Framebuffer {
  framebuffer: WebGLFramebuffer
  constructor(public context: Context, public size: Vec2) {
    const {gl, drawBuffersExt} = context
    this.framebuffer = gl.createFramebuffer()!
  }

  setTexture(texture: Texture) {
    const {gl, drawBuffersExt} = this.context
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.texture, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  use(render: () => void) {
    const {gl} = this.context
    gl.viewport(0, 0, this.size.width, this.size.height)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
    render()
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }
}

export
class DefaultFramebuffer {
  constructor(public context: Context) {
  }
  use(render: () => void) {
    const {gl, element} = this.context
    gl.viewport(0, 0, element.width, element.height)
    render()
  }
}
