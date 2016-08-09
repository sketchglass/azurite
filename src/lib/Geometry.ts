export
class Point {
  constructor(public x: number, public y: number) {
  }

  add(a: Point) {
      return new Point(this.x + a.x, this.y + a.y)
  }

  sub(a: Point) {
      return new Point(this.x - a.x, this.y - a.y)
  }

  mul(a: number) {
      return new Point(this.x * a, this.y * a)
  }

  div(a: number) {
      return new Point(this.x / a, this.y / a)
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }
  atan2() {
    return Math.atan2(this.y, this.x)
  }
}

export
class Size {
  constructor(public width: number, public height: number) {
  }
}
