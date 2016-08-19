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
}
