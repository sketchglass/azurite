// for point / size
export
class Vec2 {
  constructor(public x: number, public y: number = x) {
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
  squaredLength() {
    return this.x * this.x + this.y * this.y
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
  constructor(public x: number, public y: number = x, public z: number = x, public w: number = x) {
  }

  static fromVec2(xy: Vec2, zw: Vec2) {
    return new Vec4(xy.x, xy.y, zw.x, zw.y)
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
  get width() {
    return this.z
  }
  get height() {
    return this.w
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

  transformRect(r: Vec4) {
    const points = [
      r.xy,
      new Vec2(r.x + r.width, r.y),
      new Vec2(r.x, r.y + r.height),
      r.xy.add(r.size),
    ]
    const mapped = points.map(p => this.transform(p))
    const xs = mapped.map(p => p.x)
    const ys = mapped.map(p => p.y)
    const left = Math.min(...xs)
    const right = Math.max(...xs)
    const top = Math.min(...ys)
    const bottom = Math.max(...ys)
    return new Vec4(left, top, right - left, bottom - top)
  }
}

export function unionRect(...rects: Vec4[]) {
  const left = Math.min(...rects.map(r => r.x))
  const top = Math.min(...rects.map(r => r.y))
  const right = Math.max(...rects.map(r => r.x + r.width))
  const bottom = Math.max(...rects.map(r => r.y + r.height))
  return new Vec4(left, top, right - left, bottom - top)
}

export function intersectionRect(...rects: Vec4[]) {
  const left = Math.max(...rects.map(r => r.x))
  const top = Math.max(...rects.map(r => r.y))
  const right = Math.min(...rects.map(r => r.x + r.width))
  const bottom = Math.min(...rects.map(r => r.y + r.height))
  return new Vec4(left, top, Math.max(right - left, 0), Math.max(bottom - top, 0))
}

export function intBoundingRect(rect: Vec4) {
  const topLeft = rect.xy.floor()
  const bottomRight = rect.xy.add(rect.size).ceil()
  return Vec4.fromVec2(topLeft, bottomRight.sub(topLeft))
}

export
class CubicPolynomial {
  // x(t) = c0 + c1 * x + c2 * x^2 + c3 * x ^ 3
  constructor(public c0: number, public c1: number, public c2: number, public c3: number) {
  }
  // Calc x(t)
  eval(t: number) {
    const {c0, c1, c2, c3} = this
    const t2 = t * t
    const t3 = t2 * t
    return c0 + c1 * t + c2 * t2 + c3 * t3
  }
  // Return x(t) such that x(0) = x0, x(1) = x1, x'(0) = t0, x'(1) = t1
  static fromSlopes(x0: number, x1: number, t0: number, t1: number) {
    return new CubicPolynomial(
      x0,
      t0,
      -3 * x0 + 3 * x1 - 2 * t0 - t1,
      2 * x0 - 2 * x1 + t0 + t1
    )
  }
}

// Return polynomial for catmull rom interpolation between x1 and x2
export function catmullRom(x0: number, x1: number, x2: number, x3: number) {
  return CubicPolynomial.fromSlopes(x1, x2, (x2 - x0) * 0.5, (x3 - x1) * 0.5)
}

// Return polynomial for non-uniform catmull rom interpolation
export function nonUniformCatmullRom(x0: number, x1: number, x2: number, x3: number, dt0: number, dt1: number, dt2: number) {
  let t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1;
  let t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2;
  t1 *= dt1;
  t2 *= dt1;
  return CubicPolynomial.fromSlopes(x1, x2, t1, t2)
}

// Return centripetal catmull rom interpolation between points
// http://stackoverflow.com/questions/9489736/catmull-rom-curve-with-no-cusps-and-no-self-intersections/23980479#23980479
export function centripetalCatmullRom(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2): [CubicPolynomial, CubicPolynomial] {
  let dt0 = Math.pow(p1.sub(p0).squaredLength(), 0.25)
  let dt1 = Math.pow(p2.sub(p1).squaredLength(), 0.25)
  let dt2 = Math.pow(p3.sub(p2).squaredLength(), 0.25)

  if (dt1 < 1e-4) dt1 = 1.0;
  if (dt0 < 1e-4) dt0 = dt1;
  if (dt2 < 1e-4) dt2 = dt1;

  return [
    nonUniformCatmullRom(p0.x, p1.x, p2.x, p3.x, dt0, dt1, dt2),
    nonUniformCatmullRom(p0.y, p1.y, p2.y, p3.y, dt0, dt1, dt2),
  ]
}
