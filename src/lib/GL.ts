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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.width, size.height, 0, gl.RGBA, halfFloatExt.HALF_FLOAT_OES, null as any);
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
const enum VertexBufferUsage {
  StaticDraw, StreamDraw, DynamicDraw
}

export
class VertexBuffer {
  buffer: WebGLBuffer
  vertexArray: any
  constructor(public context: Context, public data: Float32Array, public usage: VertexBufferUsage) {
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
      case VertexBufferUsage.StaticDraw:
        return gl.STATIC_DRAW
      case VertexBufferUsage.StreamDraw:
        return gl.STREAM_DRAW
      case VertexBufferUsage.DynamicDraw:
      default:
        return gl.DYNAMIC_DRAW
    }
  }
}


export
abstract class ShaderBase {
  abstract vertexShader: string
  abstract fragmentShader: string

  program: WebGLProgram

  constructor(public context: Context) {
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
class Shader extends ShaderBase {
  get vertexShader() {
    return `
      precision mediump float;

      uniform mat3 uTransform;
      attribute vec2 aPosition;
      attribute vec2 aUVPosition;
      varying vec2 vUVPosition;

      void main(void) {
        vUVPosition = aUVPosition;
        vec3 pos = uTransform * vec3(aPosition, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
      }
    `
  }
  get fragmentShader() {
    return `
      precision lowp float;
      varying mediump vec2 vUVPosition;
      void main(void) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `
  }

  setTransform(transform: Transform) {
    this.setUniformTransform('uTransform', transform)
  }
}

export
class TextureShader extends Shader {
  get fragmentShader() {
    return `
      precision lowp float;
      varying mediump vec2 vUVPosition;
      uniform sampler2D uTexture;
      void main(void) {
        gl_FragColor = texture2D(uTexture, vUVPosition);
      }
    `
  }

  constructor(public context: Context) {
    super(context)
    const {gl} = context
  }

  setTexture(textureUnit: number) {
    this.setUniformInt("uTexture", textureUnit)
  }
}

export
class ColorShader extends Shader {
  get fragmentShader() {
    return `
      precision lowp float;
      uniform lowp vec4 uColor;
      void main(void) {
        gl_FragColor = uColor;
      }
    `
  }

  constructor(public context: Context) {
    super(context)
    const {gl} = context
  }

  setColor(color: Vec4) {
    this.setUniformVec4("uColor", color)
  }
}

export
class Model {
  vertexArray: any
  constructor(public context: Context, public vertexBuffer: VertexBuffer, public shader: Shader) {
    const {gl, vertexArrayExt} = context
    this.vertexArray = vertexArrayExt.createVertexArrayOES()
    vertexArrayExt.bindVertexArrayOES(this.vertexArray)
    gl.useProgram(shader.program)
    const aPosition = gl.getAttribLocation(shader.program, 'aPosition')!
    const aUVPosition = gl.getAttribLocation(shader.program, 'aUVPosition')!
    gl.enableVertexAttribArray(aPosition)
    gl.enableVertexAttribArray(aUVPosition)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer.buffer)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 16, 0)
    gl.vertexAttribPointer(aUVPosition, 2, gl.FLOAT, false, 16, 8)
    vertexArrayExt.bindVertexArrayOES(null)
  }

  render() {
    const {gl, vertexArrayExt} = this.context
    gl.useProgram(this.shader.program)
    vertexArrayExt.bindVertexArrayOES(this.vertexArray)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexBuffer.data.length / 4)
    vertexArrayExt.bindVertexArrayOES(null)
  }

  renderPoints() {
    const {gl, vertexArrayExt} = this.context
    gl.useProgram(this.shader.program)
    vertexArrayExt.bindVertexArrayOES(this.vertexArray)
    gl.drawArrays(gl.POINTS, 0, this.vertexBuffer.data.length / 4)
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
