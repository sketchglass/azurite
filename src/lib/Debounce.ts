
// ensure 1 call per frame
export
function frameDebounce<T extends Function>(func: T) {
  let needCall = false
  function onFrame() {
    if (needCall) {
      func.apply(this, arguments)
      needCall = false
    }
  }
  return function debounced() {
    needCall = true
    requestAnimationFrame(onFrame)
  }
}
