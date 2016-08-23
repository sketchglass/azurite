// for point / size
export
class Vec2 {
  constructor(public x: number, public y: number) {
  }

  get width() {
    return this.x;
  }
  get height() {
    return this.y;
  }

  add(a: Vec2) {
      return new Vec2(this.x + a.x, this.y + a.y)
  }

  sub(a: Vec2) {
      return new Vec2(this.x - a.x, this.y - a.y)
  }

  mul(a: number) {
      return new Vec2(this.x * a, this.y * a)
  }

  div(a: number) {
      return new Vec2(this.x / a, this.y / a)
  }

  neg() {
    return  new Vec2(-this.x, -this.y)
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }
  atan2() {
    return Math.atan2(this.y, this.x)
  }
  floor() {
    return new Vec2(Math.floor(this.x), Math.floor(this.y))
  }
  ceil() {
    return new Vec2(Math.ceil(this.x), Math.ceil(this.y))
  }
  frac() {
    return this.sub(this.floor())
  }

  toGLData() {
    return new Float32Array([this.x, this.y])
  }
  toString() {
    return `Vec2(${this.x},${this.y})`
  }
}

// for color / rectangle
export
class Vec4 {
  constructor(public x: number, public y: number, public z: number, public w: number) {
  }

  get r() {
    return this.x
  }
  get g() {
    return this.y
  }
  get b() {
    return this.z
  }
  get a() {
    return this.w
  }
  get xy() {
    return new Vec2(this.x, this.y)
  }
  get zw() {
    return new Vec2(this.z, this.w)
  }
  get size() {
    return new Vec2(this.z, this.w)
  }

  add(a: Vec4) {
    return new Vec4(this.x + a.x, this.y + a.y, this.z + a.z, this.w + a.w)
  }

  sub(a: Vec4) {
    return new Vec4(this.x - a.x, this.y - a.y, this.z - a.z, this.w - a.w)
  }

  mul(a: number) {
      return new Vec4(this.x * a, this.y * a, this.z * a, this.w * a)
  }

  div(a: number) {
      return new Vec4(this.x / a, this.y / a, this.z / a, this.w / a)
  }

  toGLData() {
    return new Float32Array([this.x, this.y, this.z, this.w])
  }
  toString() {
    return `Vec4(${this.x},${this.y},${this.z},${this.w})`
  }
}

export
class Transform {
  constructor(public m11: number, public m12: number, public m21: number, public m22: number, public dx: number, public dy: number) {
  }

  merge(other: Transform) {
    // other * this
    // [P u] [Q v]   [PQ Pv + u]
    // [0 1] [0 1] = [0  1     ]
    const m11 = other.m11 * this.m11 + other.m21 * this.m12
    const m21 = other.m11 * this.m21 + other.m21 * this.m22
    const m12 = other.m12 * this.m11 + other.m22 * this.m12
    const m22 = other.m12 * this.m21 + other.m22 * this.m22
    const dx = other.m11 * this.dx + other.m21 * this.dy + other.dx
    const dy = other.m12 * this.dx + other.m22 * this.dy + other.dy
    return new Transform(m11, m12, m21, m22, dx, dy)
  }

  invert() {
    // [P u]^-1   [P^-1 -P^1 * v]
    // [0 1]    = [0    1       ]
    const det = this.m11 * this.m22 - this.m12 * this.m21
    const m11 = this.m22 / det
    const m12 = -this.m12 / det
    const m21 = -this.m21 / det
    const m22 = this.m11 / det
    const dx = -(m11 * this.dx + m21 * this.dy)
    const dy = -(m12 * this.dx + m22 * this.dy)
    return new Transform(m11, m12, m21, m22, dx, dy)
  }

  toGLData() {
    return new Float32Array([this.m11, this.m12, 0, this.m21, this.m22, 0, this.dx, this.dy, 1])
  }

  toString() {
    return `Transform(${this.m11},${this.m12}],[${this.m21},${this.m22}],[${this.dx},${this.dy})`
  }

  static identity = new Transform(1, 0, 0, 1, 0, 0)

  static scale(scale: Vec2) {
    return new Transform(scale.x, 0, 0, scale.y, 0, 0)
  }

  static translate(translation: Vec2) {
    return new Transform(1, 0, 0, 1, translation.x, translation.y)
  }

  transform(v: Vec2) {
    const x = this.m11 * v.x + this.m21 * v.y + this.dx
    const y = this.m12 * v.x + this.m22 * v.y + this.dy
    return new Vec2(x, y)
  }
}
