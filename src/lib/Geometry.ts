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
}

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
}
