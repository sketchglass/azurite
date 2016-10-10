import {Vec2} from "paintvec"

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
