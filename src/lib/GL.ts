import {Vec2, Vec4, Transform} from "./Geometry"

export
class Context {
  gl: WebGLRenderingContext
  halfFloatExt: any
  vertexArrayExt: any
  drawBuffersExt: any

  constructor(public canvas: HTMLCanvasElement, size: Vec2) {
    const glOpts = {
      preserveDrawingBuffer: false,
      alpha: false,
      depth: false,
      stencil: false,
      antialias: true,
      premultipliedAlpha: true,
    };
    const gl = this.gl = canvas.getContext("webgl", glOpts)! as WebGLRenderingContext
    this.halfFloatExt = this.gl.getExtension("OES_texture_half_float")
    this.vertexArrayExt = this.gl.getExtension("OES_vertex_array_object")
    this.drawBuffersExt = this.gl.getExtension("WEBGL_draw_buffers")

    gl.clearColor(1, 1, 1, 1)
    this.resize(size)
  }

  resize(size: Vec2) {
    const {gl} = this
    gl.viewport(0, 0, size.width, size.height)
  }
}

export
abstract class Shader {
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.width, size.height, 0, gl.RGBA, halfFloatExt.HALF_FLOAT_OES);
  }
}

export
const enum PolygonUsage {
  StaticDraw, StreamDraw, DynamicDraw
}

export
class Polygon {
  buffer: WebGLBuffer
  vertexArray: any
  constructor(public context: Context, public data: Float32Array, public usage: PolygonUsage) {
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
      case PolygonUsage.StaticDraw:
        return gl.STATIC_DRAW
      case PolygonUsage.StreamDraw:
        return gl.STREAM_DRAW
      case PolygonUsage.DynamicDraw:
      default:
        return gl.DYNAMIC_DRAW
    }
  }
}

export
class PolygonShader extends Shader {
  get vertexShader() {
    return `
      precision mediump float;

      uniform mat3 uTransform;
      attribute vec2 aPosition;
      attribute vec2 aTextureCoord;
      varying vec2 vTextureCoord;

      void main(void) {
        vTextureCoord = aTextureCoord;
        vec3 pos = uTransform * vec3(aPosition, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
      }
    `
  }
  get fragmentShader() {
    return `
      precision lowp float;
      varying mediump vec2 vTextureCoord;
      void main(void) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `
  }

  aPosition: number
  aTextureCoord: number
  uTransform: WebGLUniformLocation

  constructor(public context: Context) {
    super(context)
    const {gl} = context
    this.aPosition = gl.getAttribLocation(this.program, 'aPosition')!
    this.aTextureCoord = gl.getAttribLocation(this.program, 'aAAOffset')!
    this.uTransform = gl.getUniformLocation(this.program, 'uTransform')!
  }

  setTransform(transform: Transform) {
    const {gl} = this.context
    gl.uniformMatrix3fv(this.uTransform, false, transform.toGLData());
  }
}

export
abstract class Model {
  abstract render(transform: Transform): void
}

export
class PolygonModel extends Model {
  vertexArray: any
  constructor(public context: Context, public polygon: Polygon, public shader: PolygonShader) {
    super()
    const {gl, vertexArrayExt} = context
    this.vertexArray = vertexArrayExt.createVertexArrayOES()
    vertexArrayExt.bindVertexArrayOES(this.vertexArray)
    gl.useProgram(shader.program)
    gl.enableVertexAttribArray(shader.aPosition)
    gl.enableVertexAttribArray(shader.aTextureCoord)
    gl.vertexAttribPointer(shader.aPosition, 2, gl.FLOAT, false, 16, 0)
    gl.vertexAttribPointer(shader.aTextureCoord, 2, gl.FLOAT, false, 16, 8)
    vertexArrayExt.bindVertexArrayOES(null)
  }

  render(transform: Transform) {
    const {gl, vertexArrayExt} = this.context
    this.shader.setTransform(transform)
    vertexArrayExt.bindVertexArrayOES(this.vertexArray)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.polygon.buffer)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.polygon.data.length / 4)
    vertexArrayExt.bindVertexArrayOES(null)
  }
}

export
class Scene {
  models: Model[] = []
  size = new Vec2(100, 100)
  transform = Transform.identity

  constructor(public context: Context) {
  }

  render() {
    const sceneToUnit = Transform.scale(new Vec2(2 / this.size.width, 2 / this.size.height))
    const transform = this.transform.merge(sceneToUnit)
    const {gl} = this.context

    gl.clear(gl.COLOR_BUFFER_BIT)
    for (const model of this.models) {
      model.render(transform)
    }
  }
}

export
class Framebuffer {
  framebuffer: WebGLFramebuffer
  constructor(public context: Context, public textures: Texture[]|Texture) {
    const {gl, drawBuffersExt} = context
    this.framebuffer = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
    if (Array.isArray(textures)) {
      for (const [i, tex] of textures.entries()) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, drawBuffersExt[`COLOR_ATTACHMENT${i}_WEBGL`], gl.TEXTURE_2D, tex.texture, 0)
      }
    } else {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures.texture, 0)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  render(scene: Scene) {
    const {gl} = this.context
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
    scene.render()
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }
}
