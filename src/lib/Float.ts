// http://stackoverflow.com/questions/32633585/how-do-you-convert-to-half-floats-in-javascript

export
function float32To16(x: number) {
  let bits = (x >> 16) & 0x8000 /* Get the sign */
  let m = (x >> 12) & 0x07ff /* Keep one extra bit for rounding */
  let e = (x >> 23) & 0xff /* Using int is faster here */

  /* If zero, or denormal, or exponent underflows too much for a denormal
   * half, return signed zero. */
  if (e < 103) {
    return bits
  }

  /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
  if (e > 142) {
    bits |= 0x7c00
    /* If exponent was 0xff and one mantissa bit was set, it means NaN,
         * not Inf, so make sure we set one mantissa bit too. */
    bits |= ((e === 255) ? 0 : 1) && (x & 0x007fffff)
    return bits
  }

  /* If exponent underflows but not too much, return a denormal */
  if (e < 113) {
    m |= 0x0800
    /* Extra rounding may overflow and set mantissa to 0 and exponent
     * to 1, which is OK. */
    bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1)
    return bits
  }

  bits |= ((e - 112) << 10) | (m >> 1)
  /* Extra rounding. An overflow will set mantissa to 0 and increment
   * the exponent, which is OK. */
  bits += m & 1
  return bits
}

export
function float32ArrayTo16(data: Float32Array) {
  const src = new Uint32Array(data.buffer)
  const dst = new Uint16Array(data.length)
  for (let i = 0; i < data.length; ++i) {
    dst[i] = float32To16(src[i])
  }
  return dst
}
